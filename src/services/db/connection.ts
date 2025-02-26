
import { initDB } from './initDB';

let activeConnection: IDBDatabase | null = null;

export const getConnection = async (): Promise<IDBDatabase> => {
  if (activeConnection && activeConnection.transaction) {
    return activeConnection;
  }
  activeConnection = await initDB();
  return activeConnection;
};

export const getRetryDelay = (retryCount: number, backoffArray: number[]): number => {
  return backoffArray[Math.min(retryCount, backoffArray.length - 1)];
};
