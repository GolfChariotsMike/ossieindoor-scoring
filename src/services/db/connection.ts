
import { initDB, closeDB as closeDBInstance } from './initDB';

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
  
  // Create a new connection promise
  connectionPromise = (async () => {
    try {
      // Add retry logic
      connectionRetries = 0;
      while (connectionRetries < MAX_CONNECTION_RETRIES) {
        try {
          const db = await initDB();
          isClosingConnection = false;
          
          // Success - return the db connection
          connectionRetries = 0;
          return db;
        } catch (error) {
          connectionRetries++;
          console.error(`IndexedDB connection attempt ${connectionRetries} failed:`, error);
          
          if (connectionRetries >= MAX_CONNECTION_RETRIES) {
            throw error; // Give up after max retries
          }
          
          // Wait a bit longer between each retry
          await new Promise(r => setTimeout(r, connectionRetries * 1000));
        }
      }
      
      throw new Error('Failed to connect to IndexedDB after multiple retries');
    } catch (error) {
      console.error('Error initializing IndexedDB connection after multiple attempts:', error);
      throw error;
    } finally {
      // Always clear the promise when done, whether successful or not
      connectionPromise = null;
    }
  })();
  
  return connectionPromise;
};

export const getRetryDelay = (retryCount: number, backoffArray: number[]): number => {
  return backoffArray[Math.min(retryCount, backoffArray.length - 1)];
};

// Function to safely close the connection
export const closeDB = () => {
  // Forward to the initDB module's closeDB function
  closeDBInstance();
  connectionPromise = null;
};

// Function to reset the connection if it's in a problematic state
export const resetConnection = async (): Promise<IDBDatabase> => {
  // Clear the promise to force a new connection
  connectionPromise = null;
  connectionRetries = 0;
  
  // Close the existing connection through initDB
  try {
    closeDB();
  } catch (e) {
    console.log('Error while closing connection during reset:', e);
  }
  
  // Get a fresh connection
  return getConnection();
};
