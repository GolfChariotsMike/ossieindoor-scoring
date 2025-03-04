import { openDB } from 'idb';

export interface PendingScore {
  id: string;
  matchId: string;
  homeScores: number[];
  awayScores: number[];
  timestamp: string;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed';
  homeTeamName?: string;
  awayTeamName?: string;
}

export const savePendingScore = async (score: Omit<PendingScore, 'status'>): Promise<void> => {
  try {
    const db = await openDB('volleyball-app', 1);
    await db.put('pendingScores', {
      ...score,
      status: 'pending'
    });
    console.log('Saved pending score:', score.id);
  } catch (error) {
    console.error('Error saving pending score:', error);
    throw error;
  }
};

export const getPendingScores = async (): Promise<PendingScore[]> => {
  try {
    const db = await openDB('volleyball-app', 1);
    const scores = await db.getAll('pendingScores');
    console.log('Retrieved pending scores:', scores.length);
    return scores as PendingScore[];
  } catch (error) {
    console.error('Error retrieving pending scores:', error);
    return [];
  }
};

export const removePendingScore = async (id: string): Promise<void> => {
  try {
    const db = await openDB('volleyball-app', 1);
    await db.delete('pendingScores', id);
    console.log('Removed pending score:', id);
  } catch (error) {
    console.error('Error removing pending score:', error);
    throw error;
  }
};

export const updatePendingScoreStatus = async (id: string, status: PendingScore['status']): Promise<void> => {
  try {
    const db = await openDB('volleyball-app', 1);
    const score = await db.get('pendingScores', id) as PendingScore;
    if (score) {
      await db.put('pendingScores', { ...score, status });
      console.log(`Updated status of pending score ${id} to ${status}`);
    } else {
      console.warn(`Pending score with id ${id} not found`);
    }
  } catch (error) {
    console.error('Error updating pending score status:', error);
    throw error;
  }
};
