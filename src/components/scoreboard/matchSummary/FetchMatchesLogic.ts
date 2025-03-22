
import { getPendingScores } from "@/services/indexedDB";
import { getAllCourtMatches } from "@/services/indexedDB";
import { transformToMatch } from "@/services/matchService";
import { isOffline } from "@/utils/offlineMode";
import { PendingScore, MatchSummary } from "@/services/db/types";

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

export const fetchMatchSummary = async (courtId?: string, pendingOnly = false): Promise<MatchSummary[]> => {
  try {
    // If we only want pending scores, get them from IndexedDB
    if (pendingOnly) {
      console.log('Fetching only pending scores');
      const pendingScores = await getPendingScores();
      console.log('Pending scores:', pendingScores);
      
      // Filter by court if courtId is provided
      // This would rely on parsing the matchId to determine court
      // For local matches, the format includes the court number
      
      // Group by match ID to avoid duplicates
      const uniqueScores = groupPendingScoresByMatch(pendingScores);
      
      // Transform pending scores into summary format
      return uniqueScores.map(score => {
        // Parse team names from match ID for local matches
        let homeTeamName = "Home Team";
        let awayTeamName = "Away Team";
        let courtNumber = courtId ? parseInt(courtId) : 0;
        
        if (score.matchId.startsWith('local-')) {
          try {
            const parts = score.matchId.split('_');
            if (parts.length >= 3) {
              // Extract court from matchId if possible (format: local-MMDDHHMMCCC)
              const firstPart = parts[0];
              if (firstPart.length >= 14) {
                courtNumber = parseInt(firstPart.slice(-3)) || 0;
              }
              
              homeTeamName = parts[1].replace(/([A-Z])/g, ' $1').trim();
              
              let awayPart = parts[2];
              if (awayPart.includes('-')) {
                awayPart = awayPart.split('-')[0];
              }
              awayTeamName = awayPart.replace(/([A-Z])/g, ' $1').trim();
            }
          } catch (error) {
            console.error('Error parsing match ID:', error);
          }
        }
        
        // Return in the format expected by SummaryTable
        return {
          id: score.id,
          matchId: score.matchId,
          homeTeam: homeTeamName,
          awayTeam: awayTeamName,
          homeScores: score.homeScores,
          awayScores: score.awayScores,
          court: courtNumber,
          timestamp: score.timestamp,
          status: score.status,
          pendingUpload: true  // Mark these as pending upload
        };
      });
    }
    
    // The original logic for fetching all matches (keeping for reference)
    const matches = courtId 
      ? await getAllCourtMatches(parseInt(courtId))
      : await getAllCourtMatches();
    
    return matches.map(match => ({
      id: match.id,
      matchId: match.id, // Add matchId for consistency
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      homeScores: match.setScores?.home || [0, 0, 0],
      awayScores: match.setScores?.away || [0, 0, 0],
      court: match.court,
      timestamp: match.startTime,
      pendingUpload: isOffline()  // Only mark as pending if we're offline
    }));
  } catch (error) {
    console.error('Error fetching match summary:', error);
    throw error;
  }
};
