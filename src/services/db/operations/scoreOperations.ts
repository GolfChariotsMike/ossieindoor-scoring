
import { PendingScore } from '../types';
import { STORES } from '../dbConfig';
import { getConnection } from '../connection';

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
