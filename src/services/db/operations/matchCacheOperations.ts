
import { getConnection, resetConnection } from '../connection';
import { STORES } from '../dbConfig';
import { Match, Fixture } from '@/types/volleyball';
import { generateMatchCode } from '@/utils/matchCodeGenerator';

// Find a match in local cache by matchCode
export const findCachedMatch = async (matchCode: string): Promise<any | null> => {
  try {
    const db = await getConnection();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([STORES.COURT_MATCHES], 'readonly');
        const store = transaction.objectStore(STORES.COURT_MATCHES);
        const index = store.index('matchCode');
        const request = index.get(matchCode);
        
        request.onsuccess = () => {
          if (request.result) {
            console.log('Found cached match:', request.result);
            resolve(request.result);
          } else {
            console.log('No cached match found for code:', matchCode);
            resolve(null);
          }
        };
        
        request.onerror = () => {
          console.error('Error finding cached match:', request.error);
          reject(request.error);
        };
        
        transaction.oncomplete = () => {
          console.log('Find match transaction completed');
        };
        
        transaction.onerror = (event) => {
          console.error('Transaction error in findCachedMatch:', event);
          reject(new Error('Transaction failed in findCachedMatch'));
        };
      } catch (error) {
        console.error('Error creating transaction in findCachedMatch:', error);
        // Try to recover by resetting connection
        resetConnection().then(() => {
          resolve(null); // Return null to allow fallback to other methods
        }).catch(err => {
          reject(err);
        });
      }
    });
  } catch (error) {
    console.error('Failed to search for cached match:', error);
    return null;
  }
};

// Create a new match in local cache
export const createCachedMatch = async (
  courtId: string,
  fixture?: Fixture,
  matchCode?: string
): Promise<any> => {
  try {
    const code = matchCode || generateMatchCode(courtId, fixture);
    const now = new Date().toISOString();
    
    const matchData = {
      id: `local-${code}-${Date.now()}`,
      matchCode: code,
      court_number: parseInt(courtId),
      start_time: fixture?.DateTime || now,
      division: fixture?.DivisionName || 'Unknown',
      home_team_id: fixture?.HomeTeamId || 'unknown',
      home_team_name: fixture?.HomeTeam || 'Team A',
      away_team_id: fixture?.AwayTeamId || 'unknown',
      away_team_name: fixture?.AwayTeam || 'Team B',
      created_at: now,
      isLocal: true
    };
    
    let maxRetries = 2;
    let attempt = 0;
    let lastError = null;
    
    while (attempt <= maxRetries) {
      try {
        const db = await getConnection();
        
        return await new Promise((resolve, reject) => {
          try {
            const transaction = db.transaction([STORES.COURT_MATCHES], 'readwrite');
            const store = transaction.objectStore(STORES.COURT_MATCHES);
            const request = store.add(matchData);
            
            request.onsuccess = () => {
              console.log('Created new cached match:', matchData);
              resolve(matchData);
            };
            
            request.onerror = () => {
              console.error('Error creating cached match:', request.error);
              reject(request.error);
            };
            
            transaction.oncomplete = () => {
              console.log('Create match transaction completed');
            };
            
            transaction.onerror = (event) => {
              console.error('Transaction error in createCachedMatch:', event);
              reject(new Error('Transaction failed in createCachedMatch'));
            };
          } catch (error) {
            console.error(`Error in createCachedMatch (attempt ${attempt+1}/${maxRetries+1}):`, error);
            reject(error);
          }
        });
      } catch (error) {
        lastError = error;
        attempt++;
        
        if (attempt <= maxRetries) {
          console.log(`Retrying createCachedMatch (${attempt}/${maxRetries})...`);
          await resetConnection();
          await new Promise(r => setTimeout(r, 500 * attempt));
        }
      }
    }
    
    // If we've exhausted retries, return a basic match object so the app doesn't crash
    console.error('Failed to create cached match after retries, returning fallback match:', lastError);
    return {
      id: `fallback-${code}-${Date.now()}`,
      matchCode: code,
      court_number: parseInt(courtId),
      start_time: now,
      division: fixture?.DivisionName || 'Unknown',
      home_team_id: fixture?.HomeTeamId || 'unknown',
      home_team_name: fixture?.HomeTeam || 'Team A',
      away_team_id: fixture?.AwayTeamId || 'unknown',
      away_team_name: fixture?.AwayTeam || 'Team B',
      created_at: now,
      isLocal: true,
      isFallback: true
    };
  } catch (error) {
    console.error('Failed to create cached match:', error);
    throw error;
  }
};

// Update the db schema to support match caching
export const ensureMatchCacheSchema = async () => {
  try {
    const db = await getConnection();
    
    // Check if the matchCode index exists
    if (!db.objectStoreNames.contains(STORES.COURT_MATCHES)) {
      console.log('COURT_MATCHES store doesn\'t exist yet, will be created during DB init');
      return;
    }
    
    try {
      const transaction = db.transaction([STORES.COURT_MATCHES], 'readonly');
      const store = transaction.objectStore(STORES.COURT_MATCHES);
      
      if (!store.indexNames.contains('matchCode')) {
        // We need to update the schema to add the index
        console.log('matchCode index doesn\'t exist, need to add it');
        db.close();
        
        // Increment version to trigger an upgrade
        const newDb = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open('VolleyballScorekeeper', db.version + 1);
          
          request.onupgradeneeded = (event) => {
            const db = request.result;
            const store = db.objectStoreNames.contains(STORES.COURT_MATCHES) 
              ? request.transaction!.objectStore(STORES.COURT_MATCHES)
              : db.createObjectStore(STORES.COURT_MATCHES, { keyPath: 'id' });
              
            if (!store.indexNames.contains('matchCode')) {
              store.createIndex('matchCode', 'matchCode', { unique: false });
              console.log('Created matchCode index');
            }
          };
          
          request.onsuccess = () => {
            console.log('Schema upgrade complete');
            resolve(request.result);
          };
          
          request.onerror = () => {
            console.error('Error upgrading database:', request.error);
            reject(request.error);
          };
        });
        
        newDb.close();
      }
    } catch (error) {
      console.error('Error checking for matchCode index:', error);
      // If transaction fails, try to reset the connection
      await resetConnection();
    }
  } catch (error) {
    console.error('Error ensuring match cache schema:', error);
  }
};
