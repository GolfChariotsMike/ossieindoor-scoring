
import { PendingScore } from './db/types';
import { initDB, closeDB } from './db/initDB';
import { STORES, RETRY_BACKOFF } from './db/dbConfig';

export { initDB, closeDB } from './db/initDB';

let activeConnection: IDBDatabase | null = null;

const getConnection = async (): Promise<IDBDatabase> => {
  if (activeConnection && activeConnection.transaction) {
    return activeConnection;
  }
  activeConnection = await initDB();
  return activeConnection;
};

export const savePendingScore = async (score: Omit<PendingScore, 'status'>): Promise<void> => {
  try {
    const db = await getConnection();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORES.PENDING_SCORES], 'readwrite');
      const store = transaction.objectStore(STORES.PENDING_SCORES);

      const scoreWithStatus: PendingScore = {
        ...score,
        status: 'pending'
      };

      const request = store.put(scoreWithStatus);

      request.onsuccess = () => {
        console.log('Successfully saved pending score to IndexedDB:', scoreWithStatus);
        resolve();
      };

      request.onerror = () => {
        console.error('Error saving to IndexedDB:', request.error);
        reject(request.error);
      };

      transaction.oncomplete = () => {
        console.log('Transaction completed successfully');
      };
    });
  } catch (error) {
    console.error('Failed to save pending score:', error);
    throw error;
  }
};

export const updatePendingScoreStatus = async (
  scoreId: string,
  status: PendingScore['status'],
  error?: string
): Promise<void> => {
  try {
    const db = await getConnection();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORES.PENDING_SCORES], 'readwrite');
      const store = transaction.objectStore(STORES.PENDING_SCORES);
      
      const getRequest = store.get(scoreId);
      
      getRequest.onsuccess = () => {
        const score = getRequest.result;
        if (score) {
          score.status = status;
          if (error) score.lastError = error;
          const updateRequest = store.put(score);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('Score not found'));
        }
      };
      
      getRequest.onerror = () => reject(getRequest.error);

      transaction.oncomplete = () => {
        console.log('Update transaction completed successfully');
      };
    });
  } catch (error) {
    console.error('Failed to update pending score status:', error);
    throw error;
  }
};

export const getPendingScores = async (): Promise<PendingScore[]> => {
  try {
    const db = await getConnection();
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.PENDING_SCORES], 'readonly');
      const store = transaction.objectStore(STORES.PENDING_SCORES);
      const statusIndex = store.index('status');
      const request = statusIndex.getAll('pending');

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Error reading from IndexedDB:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to get pending scores:', error);
    return [];
  }
};

export const getFailedScores = async (): Promise<PendingScore[]> => {
  try {
    const db = await getConnection();
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.PENDING_SCORES], 'readonly');
      const store = transaction.objectStore(STORES.PENDING_SCORES);
      const statusIndex = store.index('status');
      const request = statusIndex.getAll('failed');

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Error reading failed scores from IndexedDB:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to get failed scores:', error);
    return [];
  }
};

export const removePendingScore = async (scoreId: string): Promise<void> => {
  try {
    const db = await getConnection();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORES.PENDING_SCORES], 'readwrite');
      const store = transaction.objectStore(STORES.PENDING_SCORES);
      const request = store.delete(scoreId);

      request.onsuccess = () => {
        console.log('Successfully removed pending score:', scoreId);
        resolve();
      };

      request.onerror = () => {
        console.error('Error removing from IndexedDB:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Failed to remove pending score:', error);
    throw error;
  }
};

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

export const getRetryDelay = (retryCount: number): number => {
  return RETRY_BACKOFF[Math.min(retryCount, RETRY_BACKOFF.length - 1)];
};
