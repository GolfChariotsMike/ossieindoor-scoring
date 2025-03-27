
import { DB_NAME, DB_VERSION } from './dbConfig';
import { dbSchema, checkStoreIndexes } from './schema';

let dbInstance: IDBDatabase | null = null;
let isClosingDb = false;
let dbConnectionPromise: Promise<IDBDatabase> | null = null;
let connectionTimeout: number | null = null;
const CONNECTION_TIMEOUT_MS = 60000; // 60 seconds

export const initDB = async (): Promise<IDBDatabase> => {
  if (connectionTimeout !== null) {
    clearTimeout(connectionTimeout);
    connectionTimeout = null;
  }
  
  if (dbConnectionPromise) {
    return dbConnectionPromise;
  }
  
  if (dbInstance && !isClosingDb) {
    try {
      const objectStoreNames = Array.from(dbInstance.objectStoreNames);
      if (objectStoreNames.length > 0) {
        const testTransaction = dbInstance.transaction(objectStoreNames[0], 'readonly');
        testTransaction.abort();
        
        scheduleConnectionTimeout();
        
        return dbInstance;
      } else {
        console.warn('DB instance has no stores, creating new connection');
        dbInstance = null;
      }
    } catch (error) {
      console.warn('Existing DB instance failed connectivity test, creating new connection:', error);
      try {
        if (dbInstance && !isClosingDb) {
          isClosingDb = true;
          dbInstance.close();
          isClosingDb = false;
        }
      } catch (e) {
        console.warn('Error while closing previous connection:', e);
      } finally {
        dbInstance = null;
      }
    }
  }

  let retries = 0;
  const maxInitRetries = 3;

  dbConnectionPromise = (async () => {
    while (retries < maxInitRetries) {
      try {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open(DB_NAME, DB_VERSION);

          const requestTimeout = setTimeout(() => {
            reject(new Error('IndexedDB connection request timed out'));
          }, 10000);

          request.onerror = () => {
            clearTimeout(requestTimeout);
            console.error("Error opening IndexedDB:", request.error);
            reject(request.error);
          };

          request.onsuccess = () => {
            clearTimeout(requestTimeout);
            console.log('Successfully opened IndexedDB');
            dbInstance = request.result;

            validateIndexes(dbInstance).catch(err => {
              console.warn('Error validating indexes:', err);
            });

            dbInstance.onclose = () => {
              if (!isClosingDb) {
                console.log('IndexedDB connection closed unexpectedly');
              } else {
                console.log('IndexedDB connection closed as requested');
              }
              dbInstance = null;
              dbConnectionPromise = null;
            };

            dbInstance.onversionchange = () => {
              isClosingDb = true;
              dbInstance?.close();
              dbInstance = null;
              dbConnectionPromise = null;
              isClosingDb = false;
              console.log('IndexedDB version changed, connection closed');
            };

            dbInstance.onerror = (event) => {
              console.error('IndexedDB error:', event);
            };

            scheduleConnectionTimeout();
            
            resolve(request.result);
          };

          request.onupgradeneeded = (event) => {
            clearTimeout(requestTimeout);
            const db = (event.target as IDBOpenDBRequest).result;
            
            Object.values(dbSchema).forEach(store => {
              let objectStore;
              
              if (!db.objectStoreNames.contains(store.name)) {
                objectStore = db.createObjectStore(store.name, { keyPath: store.keyPath });
                console.log(`Created ${store.name} store`);
              } else {
                const transaction = (event.target as IDBOpenDBRequest).transaction;
                if (transaction) {
                  objectStore = transaction.objectStore(store.name);
                  console.log(`Using existing ${store.name} store`);
                }
              }
              
              if (objectStore) {
                store.indexes.forEach(index => {
                  if (!objectStore.indexNames.contains(index.name)) {
                    objectStore.createIndex(index.name, index.keyPath, index.options || {});
                    console.log(`Created index ${index.name} on ${store.name}`);
                  }
                });
              }
            });

            console.log('IndexedDB upgrade completed. Current stores:', Array.from(db.objectStoreNames));
          };
          
          request.onblocked = (event) => {
            clearTimeout(requestTimeout);
            console.warn('IndexedDB upgrade blocked. Close all other tabs/windows with this app open');
            reject(new Error('IndexedDB upgrade blocked'));
          };
        });

        dbConnectionPromise = null;
        return db;
      } catch (error) {
        console.error(`IndexedDB initialization attempt ${retries + 1} failed:`, error);
        retries++;
        if (retries === maxInitRetries) {
          dbConnectionPromise = null;
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }

    dbConnectionPromise = null;
    throw new Error('Failed to initialize IndexedDB after multiple attempts');
  })();

  return dbConnectionPromise;
};

const validateIndexes = async (db: IDBDatabase): Promise<void> => {
  console.log('Validating database indexes...');
  let needsUpgrade = false;
  
  for (const [storeName, storeSchema] of Object.entries(dbSchema)) {
    if (!db.objectStoreNames.contains(storeName)) {
      console.log(`Store ${storeName} is missing, will be created on next upgrade`);
      needsUpgrade = true;
      continue;
    }
    
    const requiredIndexNames = storeSchema.indexes.map(idx => idx.name);
    const hasAllIndexes = await checkStoreIndexes(db, storeName, requiredIndexNames);
    
    if (!hasAllIndexes) {
      console.log(`Store ${storeName} is missing required indexes, will upgrade`);
      needsUpgrade = true;
    }
  }
  
  if (needsUpgrade) {
    console.log('Database needs index upgrade, will close and reopen with higher version');
    const currentVersion = db.version;
    
    db.close();
    dbInstance = null;
    
    const upgradePromise = new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, currentVersion + 1);
      
      request.onupgradeneeded = (event) => {
        console.log('Performing index upgrade...');
        const db = request.result;
        
        Object.values(dbSchema).forEach(store => {
          if (db.objectStoreNames.contains(store.name)) {
            const transaction = (event.target as IDBOpenDBRequest).transaction;
            if (transaction) {
              const objectStore = transaction.objectStore(store.name);
              if (objectStore) {
                store.indexes.forEach(index => {
                  if (!objectStore.indexNames.contains(index.name)) {
                    try {
                      objectStore.createIndex(index.name, index.keyPath, index.options || {});
                      console.log(`Added missing index ${index.name} to ${store.name}`);
                    } catch (error) {
                      console.error(`Error creating index ${index.name}:`, error);
                    }
                  }
                });
              }
            }
          }
        });
      };
      
      request.onsuccess = () => {
        console.log('Index upgrade completed successfully');
        request.result.close();
        resolve();
      };
      
      request.onerror = () => {
        console.error('Error during index upgrade:', request.error);
        reject(request.error);
      };
    });
    
    await upgradePromise;
  }
};

const scheduleConnectionTimeout = () => {
  if (connectionTimeout !== null) {
    clearTimeout(connectionTimeout);
  }
  
  connectionTimeout = window.setTimeout(() => {
    if (dbInstance && !isClosingDb) {
      console.log('Automatically closing idle IndexedDB connection after timeout');
      closeDB();
    }
    connectionTimeout = null;
  }, CONNECTION_TIMEOUT_MS);
};

export const closeDB = () => {
  if (dbInstance) {
    try {
      isClosingDb = true;
      dbInstance.close();
    } catch (error) {
      console.error('Error closing IndexedDB connection:', error);
    } finally {
      dbInstance = null;
      dbConnectionPromise = null;
      isClosingDb = false;
      
      if (connectionTimeout !== null) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }
      
      console.log('IndexedDB connection manually closed');
    }
  }
};

export const checkStores = async (): Promise<boolean> => {
  const db = await initDB();
  const storeNames = Array.from(db.objectStoreNames);
  console.log('Available stores:', storeNames);
  return Object.values(dbSchema).every(store => 
    storeNames.includes(store.name)
  );
};
