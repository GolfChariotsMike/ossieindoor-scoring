export interface PendingScore {
  id: string;
  matchId: string;
  homeScores: number[];
  awayScores: number[];
  timestamp: string;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed';
  lastError?: string;
  fixtureTime?: string;  // Add fixture time field
  fixture_start_time?: string; // Add original fixture start time
  homeTeam?: string; // Add home team name
  awayTeam?: string; // Add away team name
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
  fixtureTime?: string;  // Added to store the formatted fixture time for display
  status?: 'pending' | 'processing' | 'failed'; // Added for showing status in UI
  pendingUpload?: boolean;
  fixture_start_time?: string; // Added to store the original fixture start time
}
