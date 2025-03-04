
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

export interface CourtMatch {
  id: string;
  PlayingAreaName: string;
  DateTime: string;
  HomeTeam?: string;
  AwayTeam?: string;
  DivisionName?: string;
  HomeTeamId?: string;
  AwayTeamId?: string;
  HomeTeamScore?: string;
  AwayTeamScore?: string;
  [key: string]: any;
}

// Initialize the database schema if needed
const initDB = async () => {
  const db = await openDB('volleyball-app', 1, {
    upgrade(db) {
      // Create stores if they don't exist
      if (!db.objectStoreNames.contains('pendingScores')) {
        db.createObjectStore('pendingScores', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('courtMatches')) {
        db.createObjectStore('courtMatches', { keyPath: 'id' });
      }
    },
  });
  return db;
};

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

// Function to save court matches for offline use
export const saveCourtMatches = async (matches: CourtMatch[]): Promise<void> => {
  try {
    await initDB();
    const db = await openDB('volleyball-app', 1);
    const tx = db.transaction('courtMatches', 'readwrite');
    
    for (const match of matches) {
      await tx.store.put(match);
    }
    
    await tx.done;
    console.log(`Saved ${matches.length} court matches to IndexedDB`);
  } catch (error) {
    console.error('Error saving court matches:', error);
    throw error;
  }
};

// Function to get court matches for a specific court and date
export const getCourtMatches = async (courtId: string, dateString: string): Promise<CourtMatch[]> => {
  try {
    await initDB();
    const db = await openDB('volleyball-app', 1);
    const allMatches = await db.getAll('courtMatches');
    
    // Filter matches by court ID and date
    const filteredMatches = allMatches.filter(match => {
      const matchesCourtId = match.PlayingAreaName === `Court ${courtId}`;
      const matchesDate = match.DateTime?.includes(dateString);
      return matchesCourtId && matchesDate;
    });
    
    console.log(`Retrieved ${filteredMatches.length} matches for court ${courtId} on ${dateString}`);
    return filteredMatches;
  } catch (error) {
    console.error('Error retrieving court matches:', error);
    return [];
  }
};

// Clean old matches (older than 7 days)
export const cleanOldMatches = async (): Promise<void> => {
  try {
    await initDB();
    const db = await openDB('volleyball-app', 1);
    const allMatches = await db.getAll('courtMatches');
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const matchesToDelete: string[] = [];
    
    for (const match of allMatches) {
      try {
        // Parse date in format dd/MM/yyyy HH:mm
        const [datePart, timePart] = match.DateTime.split(' ');
        const [day, month, year] = datePart.split('/').map(Number);
        const matchDate = new Date(year, month - 1, day);
        
        if (matchDate < sevenDaysAgo) {
          matchesToDelete.push(match.id);
        }
      } catch (error) {
        console.error('Error parsing date for match cleanup:', error);
      }
    }
    
    if (matchesToDelete.length > 0) {
      const tx = db.transaction('courtMatches', 'readwrite');
      for (const id of matchesToDelete) {
        await tx.store.delete(id);
      }
      await tx.done;
      console.log(`Cleaned up ${matchesToDelete.length} old matches`);
    } else {
      console.log('No old matches to clean up');
    }
  } catch (error) {
    console.error('Error cleaning old matches:', error);
  }
};
