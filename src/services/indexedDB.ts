const DB_NAME = 'volleyball_scores';
const DB_VERSION = 1;

interface PendingScore {
  id: string;
  matchId: string;
  homeScores: number[];
  awayScores: number[];
  timestamp: string;
  retryCount: number;
}

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("Error opening IndexedDB:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains('pendingScores')) {
        const store = db.createObjectStore('pendingScores', { keyPath: 'id' });
        store.createIndex('matchId', 'matchId', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains('courtMatches')) {
        const store = db.createObjectStore('courtMatches', { keyPath: 'id' });
        store.createIndex('courtNumber', 'PlayingAreaName', { unique: false });
        store.createIndex('matchDate', 'DateTime', { unique: false });
      }
    };
  });
};

export const savePendingScore = async (score: PendingScore): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingScores'], 'readwrite');
    const store = transaction.objectStore('pendingScores');

    const request = store.put(score);

    request.onsuccess = () => {
      console.log('Saved pending score to IndexedDB:', score);
      resolve();
    };

    request.onerror = () => {
      console.error('Error saving to IndexedDB:', request.error);
      reject(request.error);
    };
  });
};

export const getPendingScores = async (): Promise<PendingScore[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingScores'], 'readonly');
    const store = transaction.objectStore('pendingScores');
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      console.error('Error reading from IndexedDB:', request.error);
      reject(request.error);
    };
  });
};

export const removePendingScore = async (scoreId: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingScores'], 'readwrite');
    const store = transaction.objectStore('pendingScores');
    const request = store.delete(scoreId);

    request.onsuccess = () => {
      console.log('Removed pending score:', scoreId);
      resolve();
    };

    request.onerror = () => {
      console.error('Error removing from IndexedDB:', request.error);
      reject(request.error);
    };
  });
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
