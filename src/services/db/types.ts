
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

export interface MatchSummary {
  id: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeScores: number[];
  awayScores: number[];
  court: number;
  timestamp: string;
  status?: 'pending' | 'processing' | 'failed';
  pendingUpload: boolean;
}
