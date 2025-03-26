import { getPendingScores } from "@/services/indexedDB";
import { getAllCourtMatches } from "@/services/indexedDB";
import { transformToMatch } from "@/services/matchService";
import { isOffline } from "@/utils/offlineMode";
import { PendingScore, MatchSummary } from "@/services/db/types";
import { format, parseISO } from "date-fns";

// Group pending scores by match ID for easier processing
const groupPendingScoresByMatch = (pendingScores: PendingScore[]): PendingScore[] => {
  const scoresByMatch: Record<string, PendingScore> = {};
  
  pendingScores.forEach(score => {
    if (!scoresByMatch[score.matchId]) {
      scoresByMatch[score.matchId] = score;
    }
  });
  
  return Object.values(scoresByMatch);
};

// Helper function to format time from ISO string
const formatTime = (dateString: string | null): string => {
  if (!dateString) return '';
  try {
    const date = parseISO(dateString);
    return format(date, 'HH:mm');
  } catch (error) {
    console.error('Error formatting time:', dateString, error);
    return '';
  }
};

// Parse team names from match ID for local matches
const parseTeamNamesFromMatchId = (matchId: string): { homeTeam: string, awayTeam: string, courtNumber: number, timestamp: string } => {
  let homeTeam = "Home Team";
  let awayTeam = "Away Team";
  let courtNumber = 0;
  let timestamp = '';
  
  if (matchId.startsWith('local-')) {
    try {
      const parts = matchId.split('_');
      if (parts.length >= 3) {
        // Extract court from matchId if possible (format: local-MMDDHHMMCCC)
        const firstPart = parts[0];
        if (firstPart.length >= 14) {
          courtNumber = parseInt(firstPart.slice(-3)) || 0;
        }
        
        // Extract timestamp for sorting
        const timestampPart = parts[parts.length - 1];
        if (timestampPart.includes('-')) {
          timestamp = timestampPart.split('-')[1];
        }
        
        // Format team names properly
        homeTeam = parts[1].replace(/([A-Z])/g, ' $1').trim();
        
        let awayPart = parts[2];
        if (awayPart.includes('-')) {
          awayPart = awayPart.split('-')[0];
        }
        awayTeam = awayPart.replace(/([A-Z])/g, ' $1').trim();
      }
    } catch (error) {
      console.error('Error parsing match ID:', error);
    }
  }
  
  return { homeTeam, awayTeam, courtNumber, timestamp };
};

export const fetchMatchSummary = async (courtId?: string, pendingOnly = false): Promise<MatchSummary[]> => {
  try {
    // If we only want pending scores, get them from IndexedDB
    if (pendingOnly) {
      console.log('Fetching only pending scores');
      const pendingScores = await getPendingScores();
      console.log('Pending scores:', pendingScores);
      
      // Filter by court if courtId is provided
      const filteredScores = courtId 
        ? pendingScores.filter(score => {
            if (score.matchId.startsWith('local-')) {
              const { courtNumber } = parseTeamNamesFromMatchId(score.matchId);
              return courtNumber === parseInt(courtId);
            }
            return true; // Keep non-local matches until we parse them further
          })
        : pendingScores;
      
      // Group by match ID to avoid duplicates
      const uniqueScores = groupPendingScoresByMatch(filteredScores);
      
      // Transform pending scores into summary format
      return uniqueScores.map(score => {
        // Parse team names and other details from match ID
        const { homeTeam, awayTeam, courtNumber, timestamp } = parseTeamNamesFromMatchId(score.matchId);
        
        // Extract fixture time from timestamp or use score timestamp
        let fixtureTime = '';
        if (timestamp) {
          // If we have a timestamp from the match ID, use it
          try {
            const timestampDate = new Date(parseInt(timestamp));
            fixtureTime = format(timestampDate, 'HH:mm');
          } catch (e) {
            fixtureTime = formatTime(score.timestamp);
          }
        } else {
          // Otherwise use the score timestamp
          fixtureTime = formatTime(score.timestamp);
        }
        
        // Return in the format expected by SummaryTable
        return {
          id: score.id,
          matchId: score.matchId,
          homeTeam: homeTeam,
          awayTeam: awayTeam,
          homeScores: score.homeScores,
          awayScores: score.awayScores,
          court: courtId ? parseInt(courtId) : courtNumber,
          timestamp: score.timestamp,
          fixtureTime: fixtureTime,
          status: score.status,
          pendingUpload: true  // Mark these as pending upload
        };
      });
    }
    
    // The original logic for fetching all matches (keeping for reference)
    const matches = courtId 
      ? await getAllCourtMatches(courtId) // Pass courtId as string
      : await getAllCourtMatches(); // Now this works because the parameter is optional
    
    return matches.map(match => ({
      id: match.id,
      matchId: match.id, // Add matchId for consistency
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      homeScores: match.setScores?.home || [0, 0, 0],
      awayScores: match.setScores?.away || [0, 0, 0],
      court: match.court,
      timestamp: match.startTime,
      fixtureTime: formatTime(match.startTime),
      pendingUpload: isOffline()  // Only mark as pending if we're offline
    }));
  } catch (error) {
    console.error('Error fetching match summary:', error);
    throw error;
  }
};
