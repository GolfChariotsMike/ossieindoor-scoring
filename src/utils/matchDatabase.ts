
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { savePendingScore, getPendingScores, removePendingScore, updatePendingScoreStatus } from "@/services/indexedDB";
import { isOffline } from "@/utils/offlineMode";

interface PendingScore {
  id: string;
  matchId: string;
  homeScores: number[];
  awayScores: number[];
  timestamp: string;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed';
  fixtureStartTime?: string; // Added to store fixture start time
}

const MAX_RETRIES = 5;

let isProcessing = false;

const processPendingScores = async (forceProcess = false) => {
  if (isProcessing && !forceProcess) {
    console.log('Already processing pending scores, skipping...');
    return 0;
  }

  try {
    isProcessing = true;
    const pendingScores = await getPendingScores();
    console.log('Processing pending scores:', pendingScores.length);

    let processedCount = 0;
    
    // If we're in forced offline mode and not explicitly forcing processing,
    // don't try to send scores to Supabase
    if (isOffline() && !forceProcess) {
      console.log('In offline mode, pending scores will be processed later');
      isProcessing = false;
      return 0;
    }

    for (const score of pendingScores) {
      try {
        console.log('Processing score:', score.id);
        await updatePendingScoreStatus(score.id, 'processing');
        
        // Check if we have network connectivity
        if (isOffline()) {
          console.log('No network connection or offline mode enabled, will retry later');
          await updatePendingScoreStatus(score.id, 'pending');
          continue;
        }

        // Check if this is a local match ID (starts with "local-")
        const isLocalMatchId = score.matchId.startsWith('local-');
        
        // Only try to check for existing match data if it's not a local ID
        let existingData = null;
        let checkError = null;
        
        if (!isLocalMatchId) {
          // Check if a record already exists for this match
          const result = await supabase
            .from('match_data_v2')
            .select()
            .eq('match_id', score.matchId)
            .maybeSingle();
          
          existingData = result.data;
          checkError = result.error;
        }

        if (checkError) {
          console.error('Error checking existing match data:', checkError);
          score.retryCount += 1;
          await updatePendingScoreStatus(score.id, score.retryCount >= MAX_RETRIES ? 'failed' : 'pending');
          continue;
        }

        if (existingData) {
          console.log('Updating existing match data:', existingData.id);
          const { error: updateError } = await supabase
            .from('match_data_v2')
            .update({
              home_total_points: score.homeScores.reduce((a, b) => a + b, 0),
              away_total_points: score.awayScores.reduce((a, b) => a + b, 0),
              set1_home_score: score.homeScores[0] || 0,
              set1_away_score: score.awayScores[0] || 0,
              set2_home_score: score.homeScores[1] || 0,
              set2_away_score: score.awayScores[1] || 0,
              set3_home_score: score.homeScores[2] || 0,
              set3_away_score: score.awayScores[2] || 0,
              has_final_score: true,
              // Use the fixture start time if it exists in the score data
              fixture_start_time: score.fixtureStartTime || existingData.fixture_start_time
            })
            .eq('id', existingData.id);

          if (updateError) {
            throw updateError;
          }
        } else {
          console.log('Saving new match data for match:', score.matchId);
          // Calculate all the required values on the client
          // Calculate total points
          const homePointsFor = score.homeScores.reduce((acc, s) => acc + s, 0);
          const awayPointsFor = score.awayScores.reduce((acc, s) => acc + s, 0);

          // Calculate sets won
          const homeSetsWon = score.homeScores.reduce((acc, s, index) => 
            acc + (s > score.awayScores[index] ? 1 : 0), 0);
          const awaySetsWon = score.homeScores.reduce((acc, s, index) => 
            acc + (s < score.awayScores[index] ? 1 : 0), 0);

          // Determine match result
          const getResult = (isHomeTeam: boolean) => {
            const teamSetsWon = isHomeTeam ? homeSetsWon : awaySetsWon;
            const opponentSetsWon = isHomeTeam ? awaySetsWon : homeSetsWon;
            if (teamSetsWon > opponentSetsWon) return 'W';
            if (teamSetsWon < opponentSetsWon) return 'L';
            return 'D';
          };

          // Calculate bonus points per set (1 point per 10 points in each set)
          const homeBonusPoints = score.homeScores.reduce((total, setScore) => 
            total + Math.floor(setScore / 10), 0);
          const awayBonusPoints = score.awayScores.reduce((total, setScore) => 
            total + Math.floor(setScore / 10), 0);

          // Calculate total match points (bonus points + set points)
          const homeMatchPoints = homeBonusPoints + (homeSetsWon * 2);
          const awayMatchPoints = awayBonusPoints + (awaySetsWon * 2);
          
          // For local matches, parse team names from the matchId
          let homeTeamName = "Home Team";
          let awayTeamName = "Away Team";
          let courtNumber = 0;
          let division = "Unknown";
          let fixtureStartTime = score.fixtureStartTime || new Date().toISOString();
          
          if (isLocalMatchId) {
            try {
              // Parse local match ID format: local-MMDDHHMMCCC_HOMETEAM_AWAYTEAM-timestamp
              const parts = score.matchId.split('_');
              if (parts.length >= 3) {
                // Extract court number from first part (format: local-MMDDHHMMCCC)
                const firstPart = parts[0]; // e.g., local-06031845007
                courtNumber = parseInt(firstPart.slice(-3)) || 0;
                
                // Extract team names
                homeTeamName = parts[1].replace(/([A-Z])/g, ' $1').trim();
                
                // The last part might contain a timestamp, remove it
                let awayPart = parts[2];
                if (awayPart.includes('-')) {
                  awayPart = awayPart.split('-')[0];
                }
                awayTeamName = awayPart.replace(/([A-Z])/g, ' $1').trim();
                
                division = "Local Match";
                
                // Try to extract fixture start time from the match ID
                if (firstPart.length >= 8) {
                  const month = firstPart.substring(4, 6);
                  const day = firstPart.substring(6, 8);
                  const hour = firstPart.substring(8, 10);
                  const minute = firstPart.substring(10, 12);
                  // Use current year since it's not in the ID
                  const year = new Date().getFullYear();
                  // Create an ISO string date for the fixture start time
                  fixtureStartTime = new Date(year, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute)).toISOString();
                }
              }
            } catch (error) {
              console.error('Error parsing local match ID:', error);
            }
          } else {
            // Get match details from server for non-local matches
            try {
              const { data: matchData, error: matchError } = await supabase
                .from('matches_v2')
                .select('*')
                .eq('id', score.matchId)
                .single();

              if (matchError) {
                console.error('Error fetching match:', matchError);
                throw matchError;
              }

              if (matchData) {
                homeTeamName = matchData.home_team_name;
                awayTeamName = matchData.away_team_name;
                courtNumber = matchData.court_number;
                division = matchData.division || "Unknown";
                // Use the fixture start time from the match data or the score data
                fixtureStartTime = matchData.fixture_start_time || score.fixtureStartTime || matchData.start_time;
              }
            } catch (error) {
              console.error('Error fetching match details:', error);
            }
          }

          // Use upsert with match_id as the constraint
          const { error: upsertError } = await supabase
            .from('match_data_v2')
            .insert({
              match_id: isLocalMatchId ? null : score.matchId, // Only use real UUIDs for match_id
              court_number: courtNumber,
              division: division,
              home_team_name: homeTeamName,
              away_team_name: awayTeamName,
              set1_home_score: score.homeScores[0] || 0,
              set1_away_score: score.awayScores[0] || 0,
              set2_home_score: score.homeScores[1] || 0,
              set2_away_score: score.awayScores[1] || 0,
              set3_home_score: score.homeScores[2] || 0,
              set3_away_score: score.awayScores[2] || 0,
              home_total_points: homePointsFor,
              away_total_points: awayPointsFor,
              home_result: getResult(true),
              away_result: getResult(false),
              home_bonus_points: homeBonusPoints,
              away_bonus_points: awayBonusPoints,
              home_total_match_points: homeMatchPoints,
              away_total_match_points: awayMatchPoints,
              match_date: new Date().toISOString(),
              fixture_start_time: fixtureStartTime, // Use the extracted fixture start time
              has_final_score: true
            });

          if (upsertError) {
            console.error('Error saving match data:', upsertError);
            throw upsertError;
          }
        }

        await removePendingScore(score.id);
        console.log('Successfully processed pending score:', score.id);
        processedCount++;
      } catch (error) {
        console.error('Failed to process pending score:', score.id, error);
        score.retryCount += 1;
        await updatePendingScoreStatus(score.id, score.retryCount >= MAX_RETRIES ? 'failed' : 'pending');
        
        if (score.retryCount >= MAX_RETRIES) {
          console.error('Max retries reached for score:', score.id);
        }
      }
    }
    
    console.log('Finished processing scores. Total processed:', processedCount);
    return processedCount;
  } catch (error) {
    console.error('Error processing pending scores:', error);
    throw error;
  } finally {
    isProcessing = false;
  }
};

window.addEventListener('online', () => {
  console.log('Network connection restored');
});

window.addEventListener('offline', () => {
  console.log('Network connection lost, scores will be saved locally');
  toast({
    title: "You're offline",
    description: "Scores will be saved locally and can be uploaded at the end of the night.",
    variant: "default",
  });
});

export const saveMatchScores = async (
  matchId: string, 
  homeScores: number[], 
  awayScores: number[],
  submitToSupabase = false,
  fixtureStartTime?: string // Added parameter to pass fixture start time
) => {
  console.log('Starting saveMatchScores with:', {
    matchId,
    homeScores,
    awayScores,
    timestamp: new Date().toISOString(),
    submitToSupabase,
    fixtureStartTime
  });

  if (!matchId || !homeScores.length || !awayScores.length) {
    console.error('Invalid match data:', { matchId, homeScores, awayScores });
    toast({
      title: "Error saving scores",
      description: "Invalid match data provided",
      variant: "destructive",
    });
    return;
  }

  try {
    // Always save to IndexedDB as backup
    const pendingScore: Omit<PendingScore, 'status'> = {
      id: `${matchId}-${Date.now()}`,
      matchId,
      homeScores,
      awayScores,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      fixtureStartTime // Save the fixture start time
    };
    await savePendingScore(pendingScore);

    // If not submitting to Supabase, just return after saving locally
    if (!submitToSupabase) {
      console.log('Scores saved locally only - will be uploaded at end of night');
      return;
    }

    // We'll only reach this point if submitToSupabase is true (end of night summary)
    if (isOffline()) {
      toast({
        title: "You're offline",
        description: "Scores saved locally and will be uploaded when connection is restored.",
        variant: "default",
      });
      return;
    }

    // Since we're in the end-of-night process, let processPendingScores handle the upload
    // This avoids duplicating code and ensures consistent processing
    return await processPendingScores(true);
  } catch (error) {
    console.error('Error saving match scores:', error);
    
    // Only try to log errors to Supabase if we're online and explicitly submitting
    if (!isOffline() && submitToSupabase) {
      try {
        await supabase.from('crash_logs').insert({
          error_type: 'match_score_save_error',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          error_stack: JSON.stringify({
            matchId,
            homeScores,
            awayScores,
            error
          }),
          browser_info: {
            userAgent: navigator.userAgent,
            url: window.location.href
          }
        });
      } catch (logError) {
        console.error('Failed to log error to crash_logs:', logError);
      }
    }
    
    toast({
      title: "Connection Issues",
      description: "Scores saved locally and will be uploaded when connection is restored.",
      variant: "default",
    });
  }
};

export { processPendingScores };
