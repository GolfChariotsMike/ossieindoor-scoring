
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

        // Clear existing matches first
        const clearRequest = store.clear();
        clearRequest.onerror = () => {
          console.error('Error clearing court matches:', clearRequest.error);
          reject(clearRequest.error);
        };

        clearRequest.onsuccess = () => {
          let completed = 0;
          let errors = 0;

          // Ensure each match has required fields
          const processedMatches = matches.map(match => ({
            ...match,
            id: match.id || `${match.DateTime}-${match.PlayingAreaName}`,
            PlayingAreaName: match.PlayingAreaName || '',
            DateTime: match.DateTime || new Date().toISOString()
          }));

          processedMatches.forEach(match => {
            const request = store.add(match);

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
        };
        
        transaction.oncomplete = () => {
          console.log('Transaction completed successfully');
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

export const getCourtMatches = async (courtNumber: string, date: string): Promise<CourtMatch[]> => {
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
          const matches = request.result.filter(match => {
            const matchCourt = match.PlayingAreaName === `Court ${courtNumber}`;
            const matchDate = match.DateTime.split(' ')[0] === date;
            return matchCourt && matchDate;
          });
          resolve(matches);
        };

        request.onerror = () => {
          console.error('Error reading court matches from IndexedDB:', request.error);
          reject(request.error);
        };
        
        transaction.oncomplete = () => {
          console.log('Read transaction completed successfully');
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
      await new Promise(resolve => setTimeout(resolve, 1000 * retries));
    }
  }
  
  return [];
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
            const matchDate = new Date(match.DateTime.split(' ')[0]);
            const daysDiff = (now.getTime() - matchDate.getTime()) / (1000 * 3600 * 24);
            return daysDiff > 7; // Delete matches older than 7 days
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
