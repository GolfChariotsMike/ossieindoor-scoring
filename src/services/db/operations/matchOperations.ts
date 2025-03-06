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

        let completed = 0;
        let errors = 0;

        const processedMatches = matches.map(match => {
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

        let processMatch = (index: number) => {
          if (index >= processedMatches.length) {
            if (completed + errors === processedMatches.length) {
              console.log('Saved court matches to IndexedDB:', completed);
              resolve();
            }
            return;
          }
          
          const match = processedMatches[index];
          const request = store.put(match);

          request.onsuccess = () => {
            completed++;
            processMatch(index + 1);
          };

          request.onerror = (e) => {
            console.error('Error saving match to IndexedDB:', request.error);
            errors++;
            processMatch(index + 1);
          };
        };

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
      
      return;
      
    } catch (error) {
      console.error(`Failed to save court matches (attempt ${retries + 1}/${maxRetries}):`, error);
      retries++;
      
      if (retries >= maxRetries) {
        console.error('Max retries reached for saving court matches');
        throw error;
      }
      
      try {
        await resetConnection();
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (resetError) {
        console.error('Error resetting connection:', resetError);
      }
      
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
          
          const courtMatches = allMatches.filter(match => {
            if (match.court_number === parseInt(courtNumber)) return true;
            if (match.courtNumberStr === courtNumber) return true;
            if (match.PlayingAreaName === `Court ${courtNumber}`) return true;
            if (match.id && match.id.includes(`_${courtNumber}_`)) return true;
            return false;
          });
          
          console.log(`Found ${courtMatches.length} matches for Court ${courtNumber}`);
          
          if (date) {
            const dateMatches = courtMatches.filter(match => {
              if (!match.DateTime) return false;
              
              try {
                if (match.DateTime.includes(date)) return true;
                const matchDate = match.DateTime.split(' ')[0];
                if (matchDate === date) return true;
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
      
      try {
        await resetConnection();
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (resetError) {
        console.error('Error resetting connection:', resetError);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * retries));
    }
  }
  
  return [];
};

export const getAllCourtMatches = async (courtNumber: string): Promise<CourtMatch[]> => {
  return getCourtMatches(courtNumber);
};

export const cleanOldMatches = async (): Promise<void> => {
  let retries = 0;
  const maxRetries = 3;
  
  while (retries < maxRetries) {
    try {
      const db = await getConnection();
      
      return await new Promise<void>((resolve, reject) => {
        let transaction;
        
        try {
          if (!db || !db.objectStoreNames.contains(STORES.COURT_MATCHES)) {
            console.log('Database or store not ready for cleaning old matches');
            resolve();
            return;
          }
          
          transaction = db.transaction([STORES.COURT_MATCHES], 'readwrite');
        } catch (error) {
          console.error('Failed to start transaction for cleaning old matches:', error);
          reject(error);
          return;
        }
        
        transaction.onabort = (event) => {
          console.error('Clean matches transaction aborted:', event);
          reject(new Error('Transaction aborted'));
        };
        
        transaction.onerror = (event) => {
          console.error('Clean matches transaction error:', event);
          reject(transaction.error);
        };
        
        const store = transaction.objectStore(STORES.COURT_MATCHES);
        const request = store.getAll();

        request.onsuccess = () => {
          const now = new Date();
          const matches = request.result;
          console.log(`Found ${matches.length} total matches to check for cleanup`);
          
          const oldMatches = matches.filter(match => {
            try {
              let matchDate;
              if (match.DateTime && typeof match.DateTime === 'string') {
                const parts = match.DateTime.split(' ')[0].split('/');
                if (parts.length === 3) {
                  matchDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                } else {
                  matchDate = new Date(match.DateTime);
                }
              } else if (match.start_time) {
                matchDate = new Date(match.start_time);
              } else {
                return false;
              }
              
              if (isNaN(matchDate.getTime())) {
                return false;
              }
              
              const daysDiff = (now.getTime() - matchDate.getTime()) / (1000 * 3600 * 24);
              return daysDiff > 14;
            } catch (error) {
              console.error('Error parsing date for match cleanup:', error, match);
              return false;
            }
          });
          
          console.log(`Found ${oldMatches.length} matches older than 14 days to clean up`);
          
          if (oldMatches.length === 0) {
            resolve();
            return;
          }
          
          let completed = 0;
          let errors = 0;
          
          const processMatch = (index: number) => {
            if (index >= oldMatches.length) {
              if (completed + errors === oldMatches.length) {
                console.log(`Successfully deleted ${completed} old matches, with ${errors} errors`);
                resolve();
              }
              return;
            }
            
            const match = oldMatches[index];
            const deleteRequest = store.delete(match.id);
            
            deleteRequest.onsuccess = () => {
              completed++;
              processMatch(index + 1);
            };
            
            deleteRequest.onerror = () => {
              console.error('Error deleting match:', deleteRequest.error);
              errors++;
              processMatch(index + 1);
            };
          };
          
          processMatch(0);
        };

        request.onerror = () => {
          console.error('Error reading matches for cleaning:', request.error);
          reject(request.error);
        };
        
        transaction.oncomplete = () => {
          console.log('Clean old matches transaction completed successfully');
          resolve();
        };
      });
      
    } catch (error) {
      console.error(`Failed to clean old matches (attempt ${retries + 1}/${maxRetries}):`, error);
      retries++;
      
      if (retries >= maxRetries) {
        console.error('Max retries reached for cleaning old matches');
        return;
      }
      
      try {
        await resetConnection();
        await new Promise(resolve => setTimeout(resolve, 500 * retries));
      } catch (resetError) {
        console.error('Error resetting connection during cleanup:', resetError);
      }
    }
  }
};
