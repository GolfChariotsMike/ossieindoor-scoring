import { PendingScore } from '../types';
import { STORES } from '../dbConfig';
import { getConnection } from '../connection';

export const savePendingScore = async (score: Omit<PendingScore, 'status'>): Promise<void> => {
  let retries = 0;
  const maxRetries = 3;
  
  while (retries < maxRetries) {
    try {
      const db = await getConnection();
      
      await new Promise<void>((resolve, reject) => {
        let transaction;
        
        try {
          transaction = db.transaction([STORES.PENDING_SCORES], 'readwrite');
        } catch (error) {
          console.error('Failed to start score transaction:', error);
          reject(error);
          return;
        }
        
        transaction.onabort = (event) => {
          console.error('Score transaction aborted:', event);
          reject(new Error('Transaction aborted'));
        };
        
        transaction.onerror = (event) => {
          console.error('Score transaction error:', event);
          reject(transaction.error);
        };

        const store = transaction.objectStore(STORES.PENDING_SCORES);

        // Ensure all fields from the original score are preserved
        const scoreWithStatus: PendingScore = {
          ...score,
          status: 'pending'
        };

        // Log the fixture information to verify it's present
        console.log('Saving pending score to IndexedDB with fixture info:', {
          fixtureTime: scoreWithStatus.fixtureTime,
          fixture_start_time: scoreWithStatus.fixture_start_time,
          homeTeam: scoreWithStatus.homeTeam,
          awayTeam: scoreWithStatus.awayTeam
        });

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
          console.log('Score transaction completed successfully');
        };
      });
      
      // If we get here, operation succeeded
      return;
      
    } catch (error) {
      console.error(`Failed to save pending score (attempt ${retries + 1}/${maxRetries}):`, error);
      retries++;
      
      if (retries >= maxRetries) {
        console.error('Max retries reached for saving pending score');
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * retries));
    }
  }
};

export const updatePendingScoreStatus = async (
  scoreId: string,
  status: PendingScore['status'],
  error?: string
): Promise<void> => {
  let retries = 0;
  const maxRetries = 3;
  
  while (retries < maxRetries) {
    try {
      const db = await getConnection();
      
      await new Promise<void>((resolve, reject) => {
        let transaction;
        
        try {
          transaction = db.transaction([STORES.PENDING_SCORES], 'readwrite');
        } catch (error) {
          console.error('Failed to start update score transaction:', error);
          reject(error);
          return;
        }
        
        transaction.onabort = (event) => {
          console.error('Update score transaction aborted:', event);
          reject(new Error('Transaction aborted'));
        };
        
        transaction.onerror = (event) => {
          console.error('Update score transaction error:', event);
          reject(transaction.error);
        };
        
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
          console.log('Update score transaction completed successfully');
        };
      });
      
      // If we get here, operation succeeded
      return;
      
    } catch (error) {
      console.error(`Failed to update pending score status (attempt ${retries + 1}/${maxRetries}):`, error);
      retries++;
      
      if (retries >= maxRetries) {
        console.error('Max retries reached for updating pending score');
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * retries));
    }
  }
};

export const getPendingScores = async (): Promise<PendingScore[]> => {
  let retries = 0;
  const maxRetries = 3;
  
  while (retries < maxRetries) {
    try {
      const db = await getConnection();
      
      return await new Promise((resolve, reject) => {
        let transaction;
        
        try {
          transaction = db.transaction([STORES.PENDING_SCORES], 'readonly');
        } catch (error) {
          console.error('Failed to start get scores transaction:', error);
          reject(error);
          return;
        }
        
        transaction.onabort = (event) => {
          console.error('Get scores transaction aborted:', event);
          reject(new Error('Transaction aborted'));
        };
        
        transaction.onerror = (event) => {
          console.error('Get scores transaction error:', event);
          reject(transaction.error);
        };
        
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
        
        transaction.oncomplete = () => {
          console.log('Get scores transaction completed successfully');
        };
      });
      
    } catch (error) {
      console.error(`Failed to get pending scores (attempt ${retries + 1}/${maxRetries}):`, error);
      retries++;
      
      if (retries >= maxRetries) {
        console.error('Max retries reached for getting pending scores');
        return [];
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * retries));
    }
  }
  
  return [];
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
  let retries = 0;
  const maxRetries = 3;
  
  while (retries < maxRetries) {
    try {
      const db = await getConnection();
      
      await new Promise<void>((resolve, reject) => {
        let transaction;
        
        try {
          transaction = db.transaction([STORES.PENDING_SCORES], 'readwrite');
        } catch (error) {
          console.error('Failed to start remove score transaction:', error);
          reject(error);
          return;
        }
        
        transaction.onabort = (event) => {
          console.error('Remove score transaction aborted:', event);
          reject(new Error('Transaction aborted'));
        };
        
        transaction.onerror = (event) => {
          console.error('Remove score transaction error:', event);
          reject(transaction.error);
        };
        
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
        
        transaction.oncomplete = () => {
          console.log('Remove score transaction completed successfully');
        };
      });
      
      // If we get here, operation succeeded
      return;
      
    } catch (error) {
      console.error(`Failed to remove pending score (attempt ${retries + 1}/${maxRetries}):`, error);
      retries++;
      
      if (retries >= maxRetries) {
        console.error('Max retries reached for removing pending score');
        throw error;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000 * retries));
    }
  }
};
