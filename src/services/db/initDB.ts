import { DB_NAME, DB_VERSION } from './dbConfig';
import { dbSchema } from './schema';

let dbInstance: IDBDatabase | null = null;
let isClosingDb = false;
let dbConnectionPromise: Promise<IDBDatabase> | null = null;
let connectionTimeout: number | null = null;
const CONNECTION_TIMEOUT_MS = 60000; // 60 seconds

export const initDB = async (): Promise<IDBDatabase> => {
  // Clear any pending connection timeout
  if (connectionTimeout !== null) {
    clearTimeout(connectionTimeout);
    connectionTimeout = null;
  }
  
  // If there's an existing promise for a connection being established, return it
  if (dbConnectionPromise) {
    return dbConnectionPromise;
  }
  
  // If we have an existing connection that appears valid, test it first
  if (dbInstance && !isClosingDb) {
    try {
      // Test if the connection is actually working with a small transaction
      const objectStoreNames = Array.from(dbInstance.objectStoreNames);
      if (objectStoreNames.length > 0) {
        const testTransaction = dbInstance.transaction(objectStoreNames[0], 'readonly');
        testTransaction.abort(); // Just testing if it works, no need to complete
        
        // Schedule connection timeout to avoid keeping the connection open indefinitely
        scheduleConnectionTimeout();
        
        return dbInstance;
      } else {
        console.warn('DB instance has no stores, creating new connection');
        dbInstance = null;
      }
    } catch (error) {
      console.warn('Existing DB instance failed connectivity test, creating new connection:', error);
      try {
        // Only attempt to close if not already closing
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

  // Create a new connection promise that will be shared by concurrent callers
  dbConnectionPromise = (async () => {
    while (retries < maxInitRetries) {
      try {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open(DB_NAME, DB_VERSION);

          // Add timeout to prevent hanging connections
          const requestTimeout = setTimeout(() => {
            reject(new Error('IndexedDB connection request timed out'));
          }, 10000); // 10 second timeout for initial connection

          request.onerror = () => {
            clearTimeout(requestTimeout);
            console.error("Error opening IndexedDB:", request.error);
            reject(request.error);
          };

          request.onsuccess = () => {
            clearTimeout(requestTimeout);
            console.log('Successfully opened IndexedDB');
            dbInstance = request.result;

            // Handle connection closing
            dbInstance.onclose = () => {
              if (!isClosingDb) {
                console.log('IndexedDB connection closed unexpectedly');
              } else {
                console.log('IndexedDB connection closed as requested');
              }
              dbInstance = null;
              dbConnectionPromise = null;
            };

            // Handle version change
            dbInstance.onversionchange = () => {
              isClosingDb = true;
              dbInstance?.close();
              dbInstance = null;
              dbConnectionPromise = null;
              isClosingDb = false;
              console.log('IndexedDB version changed, connection closed');
            };

            // Handle error events
            dbInstance.onerror = (event) => {
              console.error('IndexedDB error:', event);
            };

            // Schedule connection timeout
            scheduleConnectionTimeout();
            
            resolve(request.result);
          };

          request.onupgradeneeded = (event) => {
            clearTimeout(requestTimeout);
            const db = (event.target as IDBOpenDBRequest).result;
            
            // Create or update stores based on schema
            Object.values(dbSchema).forEach(store => {
              try {
                // If store exists, we don't recreate it
                if (!db.objectStoreNames.contains(store.name)) {
                  const objectStore = db.createObjectStore(store.name, { keyPath: store.keyPath });
                  
                  // Create indexes
                  store.indexes.forEach(index => {
                    objectStore.createIndex(index.name, index.keyPath, index.options || {});
                  });
                  
                  console.log(`Created ${store.name} store with indexes`);
                }
              } catch (error) {
                console.error(`Error creating/updating store ${store.name}:`, error);
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

        // Clear the shared promise to allow future connection attempts if needed
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

// Schedule connection timeout to avoid keeping connections open indefinitely
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

// Cleanup function to close database connection
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
      
      // Clear any pending timeout
      if (connectionTimeout !== null) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }
      
      console.log('IndexedDB connection manually closed');
    }
  }
};

// Function to check if stores exist
export const checkStores = async (): Promise<boolean> => {
  const db = await initDB();
  const storeNames = Array.from(db.objectStoreNames);
  console.log('Available stores:', storeNames);
  return Object.values(dbSchema).every(store => 
    storeNames.includes(store.name)
  );
};
