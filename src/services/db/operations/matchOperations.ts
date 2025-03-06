
import { STORES } from '../dbConfig';
import { getConnection } from '../connection';

interface CourtMatch {
  id: string;
  PlayingAreaName: string;
  DateTime: string;
  [key: string]: any;
}

export const saveCourtMatches = async (matches: CourtMatch[]): Promise<void> => {
  if (!matches || matches.length === 0) {
    console.log('No matches to save');
    return;
  }
  
  let retries = 0;
  const maxRetries = 3;
  
  while (retries < maxRetries) {
    try {
      const db = await getConnection();
      
      await new Promise<void>((resolve, reject) => {
        let transaction;
        
        try {
          transaction = db.transaction([STORES.COURT_MATCHES], 'readwrite');
        } catch (error) {
          console.error('Failed to start transaction:', error);
          reject(error);
          return;
        }
        
        transaction.onabort = (event) => {
          console.error('Transaction aborted:', event);
          reject(new Error('Transaction aborted'));
        };
        
        transaction.onerror = (event) => {
          console.error('Transaction error:', event);
          reject(transaction.error);
        };
        
        const store = transaction.objectStore(STORES.COURT_MATCHES);

        // We no longer clear existing matches - instead, we'll update or insert
        // This way we accumulate matches even when in offline mode
        let completed = 0;
        let errors = 0;

        // Ensure each match has required fields and court numbers as strings and ints
        const processedMatches = matches.map(match => {
          // Extract court number from PlayingAreaName (e.g., "Court 1" -> "1")
          let courtNumberStr = '0';
          if (match.PlayingAreaName && typeof match.PlayingAreaName === 'string') {
            const matches = match.PlayingAreaName.match(/Court\s+(\d+)/i);
            if (matches && matches[1]) {
              courtNumberStr = matches[1];
            }
          }
          
          return {
            ...match,
            id: match.id || `${match.DateTime}-${match.PlayingAreaName}`,
            PlayingAreaName: match.PlayingAreaName || '',
            DateTime: match.DateTime || new Date().toISOString(),
            courtNumberStr: courtNumberStr,
            courtNumber: parseInt(courtNumberStr, 10)
          };
        });

        processedMatches.forEach(match => {
          // Use put instead of add to update existing records
          const request = store.put(match);

          request.onsuccess = () => {
            completed++;
            if (completed + errors === processedMatches.length) {
              console.log('Saved court matches to IndexedDB:', completed);
              resolve();
            }
          };

          request.onerror = () => {
            console.error('Error saving match to IndexedDB:', request.error);
            errors++;
            if (completed + errors === processedMatches.length) {
              if (completed > 0) {
                resolve(); // Some matches were saved
              } else {
                reject(request.error); // No matches were saved
              }
            }
          };
        });

        // Handle empty array case
        if (processedMatches.length === 0) {
          resolve();
        }
        
        transaction.oncomplete = () => {
          console.log('Match save transaction completed successfully');
          resolve();
        };
      });
      
      // If we get here, operation succeeded
      return;
      
    } catch (error) {
      console.error(`Failed to save court matches (attempt ${retries + 1}/${maxRetries}):`, error);
      retries++;
      
      if (retries >= maxRetries) {
        console.error('Max retries reached for saving court matches');
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * retries));
    }
  }
};

export const getCourtMatches = async (courtNumber: string, date?: string): Promise<CourtMatch[]> => {
  let retries = 0;
  const maxRetries = 3;
  
  while (retries < maxRetries) {
    try {
      const db = await getConnection();
      
      return await new Promise((resolve, reject) => {
        let transaction;
        
        try {
          transaction = db.transaction([STORES.COURT_MATCHES], 'readonly');
        } catch (error) {
          console.error('Failed to start read transaction:', error);
          reject(error);
          return;
        }
        
        transaction.onabort = (event) => {
          console.error('Read transaction aborted:', event);
          reject(new Error('Transaction aborted'));
        };
        
        transaction.onerror = (event) => {
          console.error('Read transaction error:', event);
          reject(transaction.error);
        };
        
        const store = transaction.objectStore(STORES.COURT_MATCHES);
        const request = store.getAll();

        request.onsuccess = () => {
          const allMatches = request.result;
          console.log(`Retrieved ${allMatches.length} total matches from cache`);
          
          // Log details of some matches to help with debugging
          if (allMatches.length > 0) {
            console.log("Sample match from IndexedDB:", JSON.stringify({
              id: allMatches[0].id,
              PlayingAreaName: allMatches[0].PlayingAreaName,
              courtNumber: allMatches[0].courtNumber,
              courtNumberStr: allMatches[0].courtNumberStr
            }));
          }
          
          // Filter for court first (most important criteria)
          // We check multiple formats of court number to be resilient
          const courtMatches = allMatches.filter(match => {
            // Check for direct courtNumber match (integer)
            const hasIntegerMatch = match.courtNumber === parseInt(courtNumber);
            
            // Check for courtNumberStr match (string)
            const hasStringMatch = match.courtNumberStr === courtNumber;
            
            // Check PlayingAreaName for 'Court X' format
            const hasPlayingAreaMatch = match.PlayingAreaName === `Court ${courtNumber}`;
            
            // Fallback check for any court number in the ID
            const hasIdMatch = match.id && match.id.includes(`_${courtNumber}_`);
            
            // Log the details for each match and why it was included/excluded
            if (hasIntegerMatch || hasStringMatch || hasPlayingAreaMatch || hasIdMatch) {
              console.log(`Match ${match.id} MATCHED court ${courtNumber} via:`, {
                integerMatch: hasIntegerMatch,
                stringMatch: hasStringMatch,
                playingAreaMatch: hasPlayingAreaMatch,
                idMatch: hasIdMatch,
                courtNumberValue: match.courtNumber,
                courtNumberStrValue: match.courtNumberStr,
                playingAreaValue: match.PlayingAreaName
              });
              return true;
            }
            
            // For diagnostics, log some details about non-matching courts
            if (allMatches.length < 10) { // Only log details if we have a reasonable number
              console.log(`Match ${match.id} did NOT match court ${courtNumber}:`, {
                courtNumberValue: match.courtNumber,
                courtNumberStrValue: match.courtNumberStr,
                playingAreaValue: match.PlayingAreaName
              });
            }
            
            return false;
          });
          
          console.log(`Found ${courtMatches.length} matches for Court ${courtNumber}`);
          
          // If date is specified, further filter by that
          if (date) {
            const dateMatches = courtMatches.filter(match => {
              if (!match.DateTime) return false;
              
              // Try different date formats and comparisons
              try {
                // Direct string comparison first (most reliable)
                const hasDateString = match.DateTime.includes(date);
                
                // Then try to extract date part for comparison
                const matchDate = match.DateTime.split(' ')[0];
                const hasDateMatch = matchDate === date;
                
                // As a fallback, try to do a more flexible date comparison
                const matchDateObj = new Date(match.DateTime);
                const targetDateObj = new Date(date);
                const hasDateObjMatch = matchDateObj.toDateString() === targetDateObj.toDateString();
                
                const matches = hasDateString || hasDateMatch || hasDateObjMatch;
                
                if (matches) {
                  console.log(`Match ${match.id} date matched: ${match.DateTime} ↔ ${date}`);
                } else if (courtMatches.length < 10) {
                  console.log(`Match ${match.id} date did NOT match: ${match.DateTime} ↔ ${date}`);
                }
                
                return matches;
              } catch (error) {
                console.error('Error comparing dates:', error);
                return false;
              }
            });
            
            console.log(`After date filtering, found ${dateMatches.length} matches for date ${date}`);
            resolve(dateMatches);
          } else {
            // If no date specified, return all court matches
            resolve(courtMatches);
          }
        };

        request.onerror = () => {
          console.error('Error reading court matches from IndexedDB:', request.error);
          reject(request.error);
        };
        
        transaction.oncomplete = () => {
          console.log('Read match transaction completed successfully');
        };
      });
      
    } catch (error) {
      console.error(`Failed to get court matches (attempt ${retries + 1}/${maxRetries}):`, error);
      retries++;
      
      if (retries >= maxRetries) {
        console.error('Max retries reached for getting court matches');
        return [];
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(r => resolve, 1000 * retries));
    }
  }
  
  return [];
};

// Add a special method to get ALL matches for a court regardless of date
export const getAllCourtMatches = async (courtNumber: string): Promise<CourtMatch[]> => {
  console.log(`Getting ALL court matches for court ${courtNumber}`);
  return getCourtMatches(courtNumber); // No date parameter will return all matches
};

export const cleanOldMatches = async (): Promise<void> => {
  try {
    const db = await getConnection();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORES.COURT_MATCHES], 'readwrite');
      const store = transaction.objectStore(STORES.COURT_MATCHES);
      const request = store.getAll();

      request.onsuccess = () => {
        const now = new Date();
        const matches = request.result;
        const deletePromises = matches
          .filter(match => {
            try {
              const matchDate = new Date(match.DateTime.split(' ')[0]);
              const daysDiff = (now.getTime() - matchDate.getTime()) / (1000 * 3600 * 24);
              return daysDiff > 7; // Delete matches older than 7 days
            } catch (error) {
              console.error('Error parsing date for match cleanup:', error);
              return false; // Don't delete if we can't parse the date
            }
          })
          .map(match => 
            new Promise<void>((res, rej) => {
              const deleteRequest = store.delete(match.id);
              deleteRequest.onsuccess = () => res();
              deleteRequest.onerror = () => rej(deleteRequest.error);
            })
          );

        Promise.all(deletePromises)
          .then(() => {
            console.log('Cleaned old matches from IndexedDB');
            resolve();
          })
          .catch(error => {
            console.error('Error cleaning old matches:', error);
            reject(error);
          });
      };

      request.onerror = () => {
        console.error('Error reading matches for cleaning:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to clean old matches:', error);
    throw error;
  }
};
