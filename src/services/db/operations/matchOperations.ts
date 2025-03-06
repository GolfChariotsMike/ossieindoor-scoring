import { STORES } from '../dbConfig';
import { getConnection, resetConnection } from '../connection';

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
          // Make sure the database is ready for a transaction
          if (!db || !db.objectStoreNames.contains(STORES.COURT_MATCHES)) {
            throw new Error('Database or store not ready');
          }
          
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
            id: match.id || `${match.DateTime}-${match.PlayingAreaName}-${Date.now()}`,
            PlayingAreaName: match.PlayingAreaName || '',
            DateTime: match.DateTime || new Date().toISOString(),
            courtNumberStr: courtNumberStr,
            court_number: parseInt(courtNumberStr, 10)
          };
        });

        // Batch processing to avoid too many operations at once
        const processMatch = (index: number) => {
          if (index >= processedMatches.length) {
            if (completed + errors === processedMatches.length) {
              console.log('Saved court matches to IndexedDB:', completed);
              resolve();
            }
            return;
          }
          
          const match = processedMatches[index];
          // Use put instead of add to update existing records
          const request = store.put(match);

          request.onsuccess = () => {
            completed++;
            // Process next match
            processMatch(index + 1);
          };

          request.onerror = (e) => {
            console.error('Error saving match to IndexedDB:', request.error);
            errors++;
            // Continue processing despite error
            processMatch(index + 1);
          };
        };

        // Start batch processing
        if (processedMatches.length > 0) {
          processMatch(0);
        } else {
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
      
      // Reset connection before retry - but wait a moment to ensure cleanup
      try {
        await resetConnection();
        // Extra delay to ensure old connections are fully closed
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (resetError) {
        console.error('Error resetting connection:', resetError);
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
          
          // Filter for court first (most important criteria)
          // We check multiple formats of court number to be resilient
          const courtMatches = allMatches.filter(match => {
            // Check for direct courtNumber match (integer)
            if (match.court_number === parseInt(courtNumber)) return true;
            
            // Check for courtNumberStr match (string)
            if (match.courtNumberStr === courtNumber) return true;
            
            // Check PlayingAreaName for 'Court X' format
            if (match.PlayingAreaName === `Court ${courtNumber}`) return true;
            
            // Fallback check for any court number in the ID
            if (match.id && match.id.includes(`_${courtNumber}_`)) return true;
            
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
                if (match.DateTime.includes(date)) return true;
                
                // Then try to extract date part for comparison
                const matchDate = match.DateTime.split(' ')[0];
                if (matchDate === date) return true;
                
                // As a fallback, try to do a more flexible date comparison
                const matchDateObj = new Date(match.DateTime);
                const targetDateObj = new Date(date);
                
                return matchDateObj.toDateString() === targetDateObj.toDateString();
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
      
      // Reset the connection before retry
      try {
        await resetConnection();
        // Add a small delay to ensure cleanup
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (resetError) {
        console.error('Error resetting connection:', resetError);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * retries));
    }
  }
  
  return [];
};

export const getAllCourtMatches = async (courtNumber: string): Promise<CourtMatch[]> => {
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
