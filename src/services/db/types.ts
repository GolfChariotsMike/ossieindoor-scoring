
export interface PendingScore {
  id: string;
  matchId: string;
  homeScores: number[];
  awayScores: number[];
  timestamp: string;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed';
  lastError?: string;
}

export interface DBStore {
  name: string;
  keyPath: string;
  indexes: Array<{
    name: string;
    keyPath: string;
    options?: IDBIndexParameters;
  }>;
}

export interface DBSchema {
  [key: string]: DBStore;
}
