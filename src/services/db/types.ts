
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

export interface DbIndexDefinition {
  name: string;
  keyPath: string | string[];
  options?: IDBIndexParameters;
}

export interface DbStoreDefinition {
  name: string;
  keyPath: string;
  indexes: DbIndexDefinition[];
}

export interface DBSchema {
  [key: string]: DbStoreDefinition;
}
