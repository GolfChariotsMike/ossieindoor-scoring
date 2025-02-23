
import { DB_NAME, DB_VERSION } from './dbConfig';
import { dbSchema } from './schema';

let dbInstance: IDBDatabase | null = null;
let initializationPromise: Promise<IDBDatabase> | null = null;

export const initDB = async (): Promise<IDBDatabase> => {
  // If we already have a database instance, return it
  if (dbInstance) {
    return dbInstance;
  }

  try {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onerror = () => {
        console.error("Error opening IndexedDB:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log('Successfully opened IndexedDB');
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        console.log('Upgrading IndexedDB...');
        const db = (event.target as IDBOpenDBRequest).result;
        
        Object.values(dbSchema).forEach(store => {
          if (!db.objectStoreNames.contains(store.name)) {
            const objectStore = db.createObjectStore(store.name, { keyPath: store.keyPath });
            store.indexes.forEach(index => {
              objectStore.createIndex(index.name, index.keyPath, index.options);
            });
          }
        });
      };
    });

    dbInstance = db;
    return db;

  } catch (error) {
    console.error('Error initializing IndexedDB:', error);
    throw error;
  }
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
    return Object.values(dbSchema).every(store => 
      storeNames.includes(store.name)
    );
  } catch (error) {
    console.error('Error checking stores:', error);
    return false;
  }
};
