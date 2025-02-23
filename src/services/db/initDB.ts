
import { DB_NAME, DB_VERSION } from './dbConfig';
import { dbSchema } from './schema';

let dbInstance: IDBDatabase | null = null;
let initializationPromise: Promise<IDBDatabase> | null = null;

export const initDB = async (): Promise<IDBDatabase> => {
  // If we already have a database instance, return it
  if (dbInstance) {
    return dbInstance;
  }

  // If we're already initializing, return the existing promise
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = new Promise<IDBDatabase>((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error("Error opening IndexedDB:", request.error);
        initializationPromise = null; // Reset promise on error
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log('Successfully opened IndexedDB');
        dbInstance = request.result;

        // Handle connection closing
        dbInstance.onclose = () => {
          console.log('IndexedDB connection closed');
          dbInstance = null;
          initializationPromise = null;
        };

        // Handle connection errors
        dbInstance.onerror = (event) => {
          console.error('IndexedDB error:', event);
        };

        resolve(dbInstance);
      };

      request.onupgradeneeded = (event) => {
        console.log('Upgrading IndexedDB...');
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

        console.log('IndexedDB upgrade completed. Current stores:', Array.from(db.objectStoreNames));
      };

      request.onblocked = () => {
        console.warn('IndexedDB upgrade blocked. Please close other tabs and try again.');
        reject(new Error('IndexedDB upgrade blocked'));
      };

    } catch (error) {
      console.error('Critical error during IndexedDB initialization:', error);
      initializationPromise = null;
      reject(error);
    }
  });

  return initializationPromise;
};

// Cleanup function to close database connection
export const closeDB = () => {
  if (dbInstance) {
    try {
      dbInstance.close();
      console.log('IndexedDB connection closed successfully');
    } catch (error) {
      console.error('Error closing IndexedDB connection:', error);
    } finally {
      dbInstance = null;
      initializationPromise = null;
    }
  }
};

// Function to check if stores exist
export const checkStores = async (): Promise<boolean> => {
  try {
    const db = await initDB();
    const storeNames = Array.from(db.objectStoreNames);
    console.log('Available stores:', storeNames);
    return Object.values(dbSchema).every(store => 
      storeNames.includes(store.name)
    );
  } catch (error) {
    console.error('Error checking stores:', error);
    return false;
  }
};
