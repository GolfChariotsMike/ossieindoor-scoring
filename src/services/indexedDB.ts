
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

