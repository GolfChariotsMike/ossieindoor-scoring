
import { initDB } from './initDB';

let activeConnection: IDBDatabase | null = null;
let connectionPromise: Promise<IDBDatabase> | null = null;

export const getConnection = async (): Promise<IDBDatabase> => {
  // If we already have an active promise, return it to avoid multiple parallel initialization
  if (connectionPromise) {
    return connectionPromise;
  }
  
  // If we have an active connection and it's still open, return it
  if (activeConnection && activeConnection.transaction) {
    return activeConnection;
  }
  
  // Create a new connection promise
  connectionPromise = new Promise(async (resolve, reject) => {
    try {
      activeConnection = await initDB();
      
      // Add onclose handler to reset our connection variables
      activeConnection.onclose = () => {
        console.log('IndexedDB connection closed');
        activeConnection = null;
        connectionPromise = null;
      };
      
      // Add versionchange handler to close connection properly
      activeConnection.onversionchange = () => {
        if (activeConnection) {
          console.log('IndexedDB version changed, closing connection');
          activeConnection.close();
          activeConnection = null;
          connectionPromise = null;
        }
      };
      
      resolve(activeConnection);
    } catch (error) {
      console.error('Error initializing IndexedDB connection:', error);
      activeConnection = null;
      connectionPromise = null;
      reject(error);
    }
  });
  
  return connectionPromise;
};

export const getRetryDelay = (retryCount: number, backoffArray: number[]): number => {
  return backoffArray[Math.min(retryCount, backoffArray.length - 1)];
};

// New function to safely close the connection (should be used when needed)
export const closeConnection = () => {
  if (activeConnection) {
    activeConnection.close();
    activeConnection = null;
    connectionPromise = null;
    console.log('IndexedDB connection manually closed');
  }
};
