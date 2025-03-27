
// Add console logging to the matchSummary fetcher to track fixture time data
import { getPendingScores } from "@/services/indexedDB";
import { getCourtMatches } from "@/services/indexedDB";
import { MatchSummary } from "@/services/db/types";
import { format, parseISO } from "date-fns";

export const fetchMatchSummary = async (courtId: string, pendingOnly = false): Promise<MatchSummary[]> => {
  try {
    console.log(`Fetching match summary for court ${courtId}, pendingOnly=${pendingOnly}`);
    
    // Get pending scores
    const pendingScores = await getPendingScores();
    console.log(`Found ${pendingScores.length} pending scores`);
    
    // Convert pending scores to match summaries
    const summaries: MatchSummary[] = pendingScores.map(score => {
      console.log(`Processing pending score with fixture info:`, {
        id: score.id,
        matchId: score.matchId,
        fixtureTime: score.fixtureTime,
        fixture_start_time: score.fixture_start_time
      });
      
      // Extract court number from matchId if possible
      let court = 0;
      if (score.matchId.includes('-')) {
        const parts = score.matchId.split('-');
        if (parts.length > 0) {
          court = parseInt(parts[0]) || 0;
        }
      }
      
      return {
        id: score.id,
        matchId: score.matchId,
        homeTeam: score.homeTeam || "Home Team",
        awayTeam: score.awayTeam || "Away Team",
        homeScores: score.homeScores,
        awayScores: score.awayScores,
        court: court,
        timestamp: score.timestamp,
        status: score.status,
        pendingUpload: true,
        fixtureTime: score.fixtureTime,
        fixture_start_time: score.fixture_start_time
      };
    });
    
    // If we're only fetching pending scores, filter by court and return
    if (pendingOnly) {
      const filteredSummaries = summaries.filter(summary => {
        // For local matches, extract court from matchId
        if (summary.matchId.startsWith('local-')) {
          const parts = summary.matchId.split('_');
          if (parts.length > 0) {
            const extractedCourtNumber = parseInt(parts[0].replace('local-', ''));
            return extractedCourtNumber.toString() === courtId;
          }
          return false;
        }
        
        // Normal filtering by court
        return summary.court.toString() === courtId;
      });
      
      console.log(`Returning ${filteredSummaries.length} filtered summaries`);
      
      // Output fixture time information for debugging
      filteredSummaries.forEach(summary => {
        console.log(`Summary fixture info: id=${summary.id}, fixtureTime=${summary.fixtureTime}, fixture_start_time=${summary.fixture_start_time}`);
      });
      
      return filteredSummaries;
    }
    
    // Get court matches from IndexedDB
    const courtMatches = await getCourtMatches(courtId);
    console.log(`Found ${courtMatches.length} court matches`);
    
    // Convert court matches to match summaries
    const matchSummaries: MatchSummary[] = courtMatches.map(match => {
      let homeScores: number[] = [];
      let awayScores: number[] = [];
      
      try {
        if (match.HomeTeamScore) homeScores = JSON.parse(match.HomeTeamScore);
        if (match.AwayTeamScore) awayScores = JSON.parse(match.AwayTeamScore);
      } catch (e) {
        console.error('Error parsing scores:', e);
      }
      
      // Format the timestamp
      let timestamp = '';
      try {
        timestamp = parseISO(match.DateTime).toISOString();
      } catch (e) {
        console.error('Error parsing date:', e);
        timestamp = new Date().toISOString();
      }
      
      // Format fixture times
      let fixtureTime = '';
      try {
        fixtureTime = match.DateTime ? format(parseISO(match.DateTime), 'dd/MM/yyyy HH:mm') : '';
      } catch (e) {
        console.error('Error formatting fixture time:', e);
      }
      
      return {
        id: match.Id,
        matchId: match.Id,
        homeTeam: match.HomeTeam,
        awayTeam: match.AwayTeam,
        homeScores,
        awayScores,
        court: parseInt(match.PlayingAreaName.replace('Court ', '')) || 0,
        timestamp,
        fixtureTime,
        fixture_start_time: match.DateTime ? parseISO(match.DateTime).toISOString() : undefined
      };
    });
    
    console.log(`Returning combined ${summaries.length + matchSummaries.length} summaries`);
    return [...summaries, ...matchSummaries];
    
  } catch (error) {
    console.error('Error fetching match summary:', error);
    return [];
  }
};
