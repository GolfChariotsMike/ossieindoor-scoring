
import { DB_NAME, DB_VERSION } from './dbConfig';
import { dbSchema } from './schema';

let dbInstance: IDBDatabase | null = null;

export const initDB = async (): Promise<IDBDatabase> => {
  // If we already have a database instance, return it
  if (dbInstance) {
    return dbInstance;
  }

  const request = indexedDB.open(DB_NAME, DB_VERSION);

  return new Promise((resolve, reject) => {
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
      console.log('Upgrading IndexedDB...');
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create stores if they don't exist
      Object.values(dbSchema).forEach(store => {
        if (!db.objectStoreNames.contains(store.name)) {
          console.log('Creating store:', store.name);
          const objectStore = db.createObjectStore(store.name, { keyPath: store.keyPath });
          
          // Create all indexes for the store
          store.indexes.forEach(index => {
            console.log('Creating index:', index.name, 'for store:', store.name);
            objectStore.createIndex(index.name, index.keyPath, index.options);
          });
        }
      });
    };
  });
};

export const closeDB = () => {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
};

export const checkStores = async (): Promise<boolean> => {
  try {
    const db = await initDB();
    const storeNames = Array.from(db.objectStoreNames);
    console.log('Checking stores, available:', storeNames);
    return Object.values(dbSchema).every(store => 
      storeNames.includes(store.name)
    );
  } catch (error) {
    console.error('Error checking stores:', error);
    return false;
  }
};
