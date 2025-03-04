
import { DBSchema } from './types';
import { STORES } from './dbConfig';

export const dbSchema: DBSchema = {
  [STORES.PENDING_SCORES]: {
    name: STORES.PENDING_SCORES,
    keyPath: 'id',
    indexes: [
      { name: 'matchId', keyPath: 'matchId' },
      { name: 'timestamp', keyPath: 'timestamp' },
      { name: 'status', keyPath: 'status' }
    ]
  },
  [STORES.COURT_MATCHES]: {
    name: STORES.COURT_MATCHES,
    keyPath: 'id',
    indexes: [
      { name: 'courtNumber', keyPath: 'court_number' },
      { name: 'matchDate', keyPath: 'start_time' },
      { name: 'matchCode', keyPath: 'matchCode', unique: false }
    ]
  }
};
