
import { supabase } from "@/integrations/supabase/client";
import { getPendingScores } from "@/services/indexedDB";
import { format, parseISO } from "date-fns";
import { MatchSummary } from "@/services/db/types";
import { isOffline } from "@/utils/offlineMode";

export const fetchMatchSummary = async (courtId: string, pendingOnly = false): Promise<MatchSummary[]> => {
  try {
    // Get pending scores first
    const pendingScores = await getPendingScores();
    console.log(`Found ${pendingScores.length} pending scores`);
    console.log('First few pending scores with fixture data:', pendingScores.slice(0, 3).map(score => ({
      id: score.id,
      matchId: score.matchId,
      fixtureTime: score.fixtureTime,
      fixture_start_time: score.fixture_start_time,
      homeTeam: score.homeTeam,
      awayTeam: score.awayTeam,
      homeScores: score.homeScores,
      awayScores: score.awayScores
    })));

    let pendingSummaries: MatchSummary[] = [];
    const matchMetadata = new Map<string, { fixtureTime?: string, fixture_start_time?: string }>();

    // Extract time-only from date strings
    const extractTimeOnly = (dateString?: string): string | undefined => {
      if (!dateString) return undefined;
      
      // If it contains date and time in format dd/MM/yyyy HH:mm
      if (/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/.test(dateString)) {
        // Extract just the time part
        return dateString.split(' ')[1];
      }
      
      return dateString;
    };

    // Get match metadata from matches_v2 table
    if (!isOffline()) {
      try {
        // Collect all unique match IDs from pending scores
        const matchIds = [...new Set(pendingScores.map(score => score.matchId))];
        
        // Only query if there are match IDs to look up
        if (matchIds.length > 0) {
          const nonLocalMatchIds = matchIds.filter(id => !id.startsWith('local-'));
          
          if (nonLocalMatchIds.length > 0) {
            const { data: matchesData, error } = await supabase
              .from('matches_v2')
              .select('id, fixture_start_time, start_time')
              .in('id', nonLocalMatchIds);
              
            if (error) {
              console.error('Error fetching match metadata:', error);
            } else if (matchesData) {
              console.log(`Found metadata for ${matchesData.length} matches`);
              matchesData.forEach(match => {
                // Format the fixture time for display - extract only time
                const fixtureTime = match.fixture_start_time ? 
                  format(parseISO(match.fixture_start_time), 'HH:mm') : 
                  (match.start_time ? format(parseISO(match.start_time), 'HH:mm') : undefined);
                  
                matchMetadata.set(match.id, {
                  fixtureTime,
                  fixture_start_time: match.fixture_start_time || match.start_time
                });
              });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching match metadata:', error);
      }
    }

    // Process pending scores into summaries
    pendingSummaries = pendingScores
      .filter(score => {
        // Filter by court if courtId is provided
        if (courtId && !isNaN(parseInt(courtId))) {
          // Local match IDs contain court number in format: local-MMDDHHMMCCC_HOMETEAM_AWAYTEAM
          if (score.matchId.startsWith('local-')) {
            const parts = score.matchId.split('_');
            if (parts.length >= 1) {
              const firstPart = parts[0]; // e.g., local-06031845007
              const matchCourtId = firstPart.slice(-3);
              return matchCourtId === courtId.padStart(3, '0');
            }
          }
          // For non-local matches, we'll have to check metadata or just include everything
          return true;
        }
        return true;
      })
      .map(score => {
        let homeTeam = 'Home Team';
        let awayTeam = 'Away Team';
        let fixtureTime = score.fixtureTime;
        let fixture_start_time = score.fixture_start_time;
        
        // Process fixture time to extract only the time part if it contains a date
        if (fixtureTime) {
          fixtureTime = extractTimeOnly(fixtureTime);
        }
        
        // If score already has team names, use those first
        if (score.homeTeam && score.awayTeam) {
          homeTeam = score.homeTeam;
          awayTeam = score.awayTeam;
        } 
        // Try to extract team names from local match IDs if not already set
        else if (score.matchId.startsWith('local-')) {
          try {
            const parts = score.matchId.split('_');
            if (parts.length >= 3) {
              // Extract better formatted team names
              homeTeam = parts[1].replace(/([A-Z])/g, ' $1').trim();
              
              let awayPart = parts[2];
              if (awayPart.includes('-')) {
                awayPart = awayPart.split('-')[0];
              }
              awayTeam = awayPart.replace(/([A-Z])/g, ' $1').trim();
              
              // Extract court number
              const firstPart = parts[0]; // e.g., local-06031845007
              const courtNum = parseInt(firstPart.slice(-3));
              
              // Get metadata for this match if available
              const metadata = matchMetadata.get(score.matchId);
              
              // Only use metadata if we don't already have fixture times from the score
              if (!fixtureTime && metadata?.fixtureTime) {
                fixtureTime = metadata.fixtureTime;
              }
              
              if (!fixture_start_time && metadata?.fixture_start_time) {
                fixture_start_time = metadata.fixture_start_time;
              }
              
              // FIX: Swap home and away scores to correct the orientation issue
              console.log(`Processing match ${score.matchId} for end of night summary (BEFORE FIX):`, {
                homeTeam,
                awayTeam,
                homeScores: score.homeScores,
                awayScores: score.awayScores
              });
              
              // Create summary with swapped scores to fix the orientation issue
              return {
                id: score.id,
                matchId: score.matchId,
                homeTeam,
                awayTeam,
                homeScores: score.awayScores, // FIXED: Swap these to correct the orientation
                awayScores: score.homeScores, // FIXED: Swap these to correct the orientation
                court: courtNum || parseInt(courtId),
                timestamp: score.timestamp,
                fixtureTime,
                fixture_start_time,
                status: score.status,
                pendingUpload: true
              };
            }
          } catch (error) {
            console.error('Error parsing local match ID:', error);
          }
        }
        
        // Get metadata for this match if available
        const metadata = matchMetadata.get(score.matchId);
        
        // Only use metadata if we don't already have fixture times from the score
        if (!fixtureTime && metadata?.fixtureTime) {
          fixtureTime = metadata.fixtureTime;
        }
        
        if (!fixture_start_time && metadata?.fixture_start_time) {
          fixture_start_time = metadata.fixture_start_time;
        }
        
        // Log with swapped scores
        console.log(`Processing match ${score.matchId} for end of night summary (BEFORE FIX):`, {
          homeTeam,
          awayTeam,
          homeScores: score.homeScores,
          awayScores: score.awayScores
        });
        
        // Default summary when we can't parse the local ID or for non-local matches
        // FIX: Swap home and away scores here too
        return {
          id: score.id,
          matchId: score.matchId,
          homeTeam,
          awayTeam,
          homeScores: score.awayScores, // FIXED: Swap scores here
          awayScores: score.homeScores, // FIXED: Swap scores here
          court: parseInt(courtId),
          timestamp: score.timestamp,
          fixtureTime,
          fixture_start_time,
          status: score.status,
          pendingUpload: true
        };
      });

    // If we only want pending scores, return them now
    if (pendingOnly) {
      console.log(`Returning ${pendingSummaries.length} pending match summaries`);
      return pendingSummaries;
    }

    // If there's no network connection, just return the pending scores
    if (isOffline()) {
      console.log('Offline mode - returning only pending scores');
      return pendingSummaries;
    }

    // Fetch matches from Supabase with scores
    let query = supabase
      .from('match_data_v2')
      .select(`
        id,
        match_id,
        court_number,
        set1_home_score,
        set1_away_score,
        set2_home_score,
        set2_away_score,
        set3_home_score,
        set3_away_score,
        home_team_name,
        away_team_name,
        match_date,
        fixture_start_time
      `);

    // Filter by court if courtId is provided
    if (courtId && !isNaN(parseInt(courtId))) {
      query = query.eq('court_number', parseInt(courtId));
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching match data:', error);
      return pendingSummaries;
    }

    const serverSummaries: MatchSummary[] = data.map(match => {
      const homeScores = [
        match.set1_home_score || 0,
        match.set2_home_score || 0,
        match.set3_home_score || 0
      ].filter(score => score > 0);
      
      const awayScores = [
        match.set1_away_score || 0,
        match.set2_away_score || 0,
        match.set3_away_score || 0
      ].filter(score => score > 0);

      // Format the fixture time for display - extract only the time part
      const fixtureTime = match.fixture_start_time ? 
        format(parseISO(match.fixture_start_time), 'HH:mm') : 
        (match.match_date ? format(parseISO(match.match_date), 'HH:mm') : undefined);

      // Log server data to debug
      console.log(`Server match ${match.id} data:`, {
        homeTeam: match.home_team_name,
        awayTeam: match.away_team_name,
        homeScores,
        awayScores
      });

      return {
        id: match.id,
        matchId: match.match_id || 'unknown',
        homeTeam: match.home_team_name,
        awayTeam: match.away_team_name,
        homeScores,
        awayScores,
        court: match.court_number,
        timestamp: match.match_date || new Date().toISOString(),
        fixtureTime,
        fixture_start_time: match.fixture_start_time || match.match_date,
        pendingUpload: false
      };
    });

    // Combine both, making sure we don't show matches that exist in both lists twice
    // We'll prioritize pending scores over server scores
    const pendingMatchIds = new Set(pendingSummaries.map(summary => summary.matchId));
    const combinedSummaries = [
      ...pendingSummaries,
      ...serverSummaries.filter(summary => !pendingMatchIds.has(summary.matchId))
    ];

    console.log(`Returning ${combinedSummaries.length} total match summaries`);
    return combinedSummaries;
  } catch (error) {
    console.error('Error in fetchMatchSummary:', error);
    return [];
  }
};
