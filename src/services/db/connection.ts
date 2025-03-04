
import { initDB } from './initDB';

let activeConnection: IDBDatabase | null = null;
let connectionPromise: Promise<IDBDatabase> | null = null;
let connectionRetries = 0;
const MAX_CONNECTION_RETRIES = 3;

export const getConnection = async (): Promise<IDBDatabase> => {
  // If we already have an active promise, return it to avoid multiple parallel initialization
  if (connectionPromise) {
    return connectionPromise;
  }
  
  // If we have an active connection and it's still open, return it
  if (activeConnection && activeConnection.transaction) {
    try {
      // Test if connection is actually working with a small transaction
      const testTransaction = activeConnection.transaction(['pendingScores'], 'readonly');
      testTransaction.abort(); // Just testing if it works, no need to complete
      return activeConnection;
    } catch (error) {
      // Connection exists but isn't working - reset and try again
      console.log('Existing connection failed test, resetting:', error);
      activeConnection = null;
    }
  }
  
  // Create a new connection promise
  connectionPromise = new Promise(async (resolve, reject) => {
    try {
      // Add retry logic
      connectionRetries = 0;
      while (connectionRetries < MAX_CONNECTION_RETRIES) {
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
          
          // Add onerror handler to catch connection errors
          activeConnection.onerror = (event) => {
            console.error('IndexedDB connection error:', event);
            // Don't reset connection here as it might still be usable for other operations
          };
          
          resolve(activeConnection);
          break; // Successfully connected, exit the retry loop
        } catch (error) {
          connectionRetries++;
          console.error(`IndexedDB connection attempt ${connectionRetries} failed:`, error);
          
          if (connectionRetries >= MAX_CONNECTION_RETRIES) {
            throw error; // Give up after max retries
          }
          
          // Wait a bit longer between each retry
          await new Promise(r => setTimeout(r, connectionRetries * 500));
        }
      }
    } catch (error) {
      console.error('Error initializing IndexedDB connection after multiple attempts:', error);
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

// New function to safely close the connection
export const closeConnection = () => {
  if (activeConnection) {
    try {
      activeConnection.close();
    } catch (error) {
      console.error('Error closing IndexedDB connection:', error);
    } finally {
      activeConnection = null;
      connectionPromise = null;
      console.log('IndexedDB connection manually closed');
    }
  }
};

// Function to reset the connection if it's in a problematic state
export const resetConnection = async (): Promise<IDBDatabase> => {
  if (activeConnection) {
    try {
      activeConnection.close();
    } catch (e) {
      console.log('Error while closing connection during reset:', e);
    }
  }
  
  activeConnection = null;
  connectionPromise = null;
  connectionRetries = 0;
  
  return getConnection();
};
