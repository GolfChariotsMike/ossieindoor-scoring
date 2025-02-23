
export const DB_NAME = 'volleyball_scores';
export const DB_VERSION = 2;

export const STORES = {
  PENDING_SCORES: 'pendingScores',
  COURT_MATCHES: 'courtMatches'
} as const;

export const MAX_RETRIES = 10;
export const RETRY_BACKOFF = [
  1000,   // 1 second
  5000,   // 5 seconds
  15000,  // 15 seconds
  30000,  // 30 seconds
  60000,  // 1 minute
  120000, // 2 minutes
  300000, // 5 minutes
  600000, // 10 minutes
  1800000, // 30 minutes
  3600000, // 1 hour
];
