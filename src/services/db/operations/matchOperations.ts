
import { STORES } from '../dbConfig';
import { getConnection } from '../connection';

export const saveCourtMatches = async (matches: any[]): Promise<void> => {
  try {
    const db = await getConnection();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORES.COURT_MATCHES], 'readwrite');
      const store = transaction.objectStore(STORES.COURT_MATCHES);

      let completed = 0;
      let errors = 0;

      matches.forEach(match => {
        const request = store.put(match);

        request.onsuccess = () => {
          completed++;
          if (completed + errors === matches.length) {
            console.log('Saved court matches to IndexedDB:', completed);
            resolve();
          }
        };

        request.onerror = () => {
          console.error('Error saving match to IndexedDB:', request.error);
          errors++;
          if (completed + errors === matches.length) {
            if (completed > 0) {
              resolve(); // Some matches were saved
            } else {
              reject(request.error); // No matches were saved
            }
          }
        };
      });

      // Handle empty array case
      if (matches.length === 0) {
        resolve();
      }
    });
  } catch (error) {
    console.error('Failed to save court matches:', error);
    throw error;
  }
};

export const getCourtMatches = async (courtNumber: string, date: string): Promise<any[]> => {
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
