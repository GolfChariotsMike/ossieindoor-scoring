
import { DB_NAME, DB_VERSION } from './dbConfig';
import { dbSchema } from './schema';

let dbInstance: IDBDatabase | null = null;

export const initDB = async (): Promise<IDBDatabase> => {
  if (dbInstance) {
    return dbInstance;
  }

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
          dbInstance = request.result;
          resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          
          // Create or update stores based on schema
          Object.values(dbSchema).forEach(store => {
            if (!db.objectStoreNames.contains(store.name)) {
              const objectStore = db.createObjectStore(store.name, { keyPath: store.keyPath });
              
              // Create indexes
              store.indexes.forEach(index => {
                objectStore.createIndex(index.name, index.keyPath, index.options);
              });
              
              console.log(`Created ${store.name} store with indexes`);
            }
          });
        });
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

// Cleanup function to close database connection
export const closeDB = () => {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
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
