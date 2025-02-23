const DB_NAME = 'volleyball_scores';
const DB_VERSION = 2;

interface PendingScore {
  id: string;
  matchId: string;
  homeScores: number[];
  awayScores: number[];
  timestamp: string;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed';
  lastError?: string;
}

const MAX_RETRIES = 10;
const RETRY_BACKOFF = [
  1000,   // 1 second
  5000,   // 5 seconds
  15000,  // 15 seconds
  30000,  // 30 seconds
  60000,  // 1 minute
  120000, // 2 minutes
  300000, // 5 minutes
  600000, // 10 minutes
  1800000, // 30 minutes
  3600000, // 1 hour
];

export const initDB = async (): Promise<IDBDatabase> => {
  let retries = 0;
  const maxInitRetries = 3;

  while (retries < maxInitRetries) {
    try {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
          console.error("Error opening IndexedDB:", request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          console.log('Successfully opened IndexedDB');
          resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          
          // Create pendingScores store if it doesn't exist
          if (!db.objectStoreNames.contains('pendingScores')) {
            const store = db.createObjectStore('pendingScores', { keyPath: 'id' });
            store.createIndex('matchId', 'matchId', { unique: false });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('status', 'status', { unique: false });
            console.log('Created pendingScores store');
          }

          // Always try to create courtMatches store
          try {
            if (!db.objectStoreNames.contains('courtMatches')) {
              const store = db.createObjectStore('courtMatches', { keyPath: 'id' });
              store.createIndex('courtNumber', 'PlayingAreaName', { unique: false });
              store.createIndex('matchDate', 'DateTime', { unique: false });
              console.log('Created courtMatches store');
            }
          } catch (error) {
            console.error('Error creating courtMatches store:', error);
          }

          console.log('IndexedDB upgrade completed. Current stores:', Array.from(db.objectStoreNames));
        };
      });

      return db;
    } catch (error) {
      console.error(`IndexedDB initialization attempt ${retries + 1} failed:`, error);
      retries++;
      if (retries === maxInitRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * retries));
    }
  }

  throw new Error('Failed to initialize IndexedDB after multiple attempts');
};

export const savePendingScore = async (score: Omit<PendingScore, 'status'>): Promise<void> => {
  let db: IDBDatabase | null = null;
  try {
    db = await initDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db!.transaction(['pendingScores'], 'readwrite');
      const store = transaction.objectStore('pendingScores');

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
        if (db) db.close();
      };
    });
  } catch (error) {
    console.error('Failed to save pending score:', error);
    throw error;
  } finally {
    if (db) db.close();
  }
};

export const updatePendingScoreStatus = async (
  scoreId: string,
  status: PendingScore['status'],
  error?: string
): Promise<void> => {
  let db: IDBDatabase | null = null;
  try {
    db = await initDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db!.transaction(['pendingScores'], 'readwrite');
      const store = transaction.objectStore('pendingScores');
      
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
        if (db) db.close();
      };
    });
  } catch (error) {
    console.error('Failed to update pending score status:', error);
    throw error;
  } finally {
    if (db) db.close();
  }
};

export const getPendingScores = async (): Promise<PendingScore[]> => {
  let db: IDBDatabase | null = null;
  try {
    db = await initDB();
    return await new Promise((resolve, reject) => {
      const transaction = db!.transaction(['pendingScores'], 'readonly');
      const store = transaction.objectStore('pendingScores');
      const statusIndex = store.index('status');
      const request = statusIndex.getAll('pending');

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Error reading from IndexedDB:', request.error);
        reject(request.error);
      };

      transaction.oncomplete = () => {
        if (db) db.close();
      };
    });
  } catch (error) {
    console.error('Failed to get pending scores:', error);
    return [];
  } finally {
    if (db) db.close();
  }
};

export const getFailedScores = async (): Promise<PendingScore[]> => {
  let db: IDBDatabase | null = null;
  try {
    db = await initDB();
    return await new Promise((resolve, reject) => {
      const transaction = db!.transaction(['pendingScores'], 'readonly');
      const store = transaction.objectStore('pendingScores');
      const statusIndex = store.index('status');
      const request = statusIndex.getAll('failed');

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Error reading failed scores from IndexedDB:', request.error);
        reject(request.error);
      };

      transaction.oncomplete = () => {
        if (db) db.close();
      };
    });
  } catch (error) {
    console.error('Failed to get failed scores:', error);
    return [];
  } finally {
    if (db) db.close();
  }
};

export const removePendingScore = async (scoreId: string): Promise<void> => {
  let db: IDBDatabase | null = null;
  try {
    db = await initDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db!.transaction(['pendingScores'], 'readwrite');
      const store = transaction.objectStore('pendingScores');
      const request = store.delete(scoreId);

      request.onsuccess = () => {
        console.log('Successfully removed pending score:', scoreId);
        resolve();
      };

      request.onerror = () => {
        console.error('Error removing from IndexedDB:', request.error);
        reject(request.error);
      };

      transaction.oncomplete = () => {
        if (db) db.close();
      };
    });
  } catch (error) {
    console.error('Failed to remove pending score:', error);
    throw error;
  } finally {
    if (db) db.close();
  }
};

export const saveCourtMatches = async (matches: any[]): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['courtMatches'], 'readwrite');
    const store = transaction.objectStore('courtMatches');

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
};

export const getCourtMatches = async (courtNumber: string, date: string): Promise<any[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['courtMatches'], 'readonly');
    const store = transaction.objectStore('courtMatches');
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
};

export const cleanOldMatches = async (): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['courtMatches'], 'readwrite');
    const store = transaction.objectStore('courtMatches');
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
};

export const getRetryDelay = (retryCount: number): number => {
  return RETRY_BACKOFF[Math.min(retryCount, RETRY_BACKOFF.length - 1)];
};
