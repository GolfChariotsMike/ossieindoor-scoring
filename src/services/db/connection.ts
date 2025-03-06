
import { initDB } from './initDB';

let activeConnection: IDBDatabase | null = null;
let connectionPromise: Promise<IDBDatabase> | null = null;
let connectionRetries = 0;
const MAX_CONNECTION_RETRIES = 3;

// Flag to track if a connection is being closed intentionally
let isClosingConnection = false;

export const getConnection = async (): Promise<IDBDatabase> => {
  // If we already have an active promise, return it to avoid multiple parallel initialization
  if (connectionPromise) {
    return connectionPromise;
  }
  
  // If we have an active connection and it's still open, return it
  if (activeConnection && activeConnection.transaction && !isClosingConnection) {
    try {
      // Test if connection is actually working with a small transaction
      const testTransaction = activeConnection.transaction(Object.keys(activeConnection.objectStoreNames), 'readonly');
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
          isClosingConnection = false;
          
          // Add onclose handler to reset our connection variables
          activeConnection.onclose = () => {
            console.log('IndexedDB connection closed');
            if (!isClosingConnection) {
              console.log('Connection was closed unexpectedly');
            }
            activeConnection = null;
            connectionPromise = null;
            isClosingConnection = false;
          };
          
          // Add versionchange handler to close connection properly
          activeConnection.onversionchange = (event) => {
            if (activeConnection) {
              console.log('IndexedDB version changed, closing connection');
              isClosingConnection = true;
              activeConnection.close();
              activeConnection = null;
              connectionPromise = null;
              isClosingConnection = false;
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
      isClosingConnection = true;
      activeConnection.close();
    } catch (error) {
      console.error('Error closing IndexedDB connection:', error);
    } finally {
      activeConnection = null;
      connectionPromise = null;
      isClosingConnection = false;
      console.log('IndexedDB connection manually closed');
    }
  }
};

// Function to reset the connection if it's in a problematic state
export const resetConnection = async (): Promise<IDBDatabase> => {
  if (activeConnection) {
    try {
      isClosingConnection = true;
      activeConnection.close();
    } catch (e) {
      console.log('Error while closing connection during reset:', e);
    } finally {
      isClosingConnection = false;
    }
  }
  
  activeConnection = null;
  connectionPromise = null;
  connectionRetries = 0;
  
  return getConnection();
};
