
import { STORES } from '../dbConfig';
import { getConnection } from '../connection';

interface CourtMatch {
  id: string;
  PlayingAreaName: string;
  DateTime: string;
  [key: string]: any;
}

export const saveCourtMatches = async (matches: CourtMatch[]): Promise<void> => {
  try {
    const db = await getConnection();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORES.COURT_MATCHES], 'readwrite');
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
    });
  } catch (error) {
    console.error('Failed to save court matches:', error);
    throw error;
  }
};

export const getCourtMatches = async (courtNumber: string, date: string): Promise<CourtMatch[]> => {
  try {
    const db = await getConnection();
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.COURT_MATCHES], 'readonly');
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
    });
  } catch (error) {
    console.error('Failed to get court matches:', error);
    return [];
  }
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
