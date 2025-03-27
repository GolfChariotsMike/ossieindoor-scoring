
import { supabase } from "@/integrations/supabase/client";
import { isOffline } from "@/utils/offlineMode";
import { MatchSummary, PendingScore } from "@/services/db/types";
import { 
  savePendingScore, 
  getPendingScores, 
  updatePendingScoreStatus, 
  removePendingScore 
} from "@/services/db/operations/scoreOperations";

// Define constants
const MAX_RETRIES = 3;
let isProcessing = false;

/**
 * Process pending scores in the database
 * @param forceProcess Force processing even if already in progress
 * @param matchSummaries Optional match summary data with fixture times
 * @returns Number of successfully processed scores
 */
export const processPendingScores = async (forceProcess = false, matchSummaries?: MatchSummary[]) => {
  if (isProcessing && !forceProcess) {
    console.log('Already processing pending scores, skipping...');
    return 0;
  }

  try {
    isProcessing = true;
    const pendingScores = await getPendingScores();
    console.log('Processing pending scores:', pendingScores.length);

    let processedCount = 0;
    
    if (isOffline() && !forceProcess) {
      console.log('In offline mode, pending scores will be processed later');
      isProcessing = false;
      return 0;
    }

    const fixtureStartTimes = new Map<string, string>();
    if (matchSummaries && matchSummaries.length > 0) {
      matchSummaries.forEach(match => {
        if (match.matchId && match.fixture_start_time) {
          fixtureStartTimes.set(match.matchId, match.fixture_start_time);
        }
      });
      console.log(`Created lookup map with ${fixtureStartTimes.size} fixture start times`);
    }

    for (const score of pendingScores) {
      try {
        console.log('Processing score:', score.id, 'with fixture time:', score.fixture_start_time);
        await updatePendingScoreStatus(score.id, 'processing');
        
        if (isOffline()) {
          console.log('No network connection or offline mode enabled, will retry later');
          await updatePendingScoreStatus(score.id, 'pending');
          continue;
        }

        const isLocalMatchId = score.matchId.startsWith('local-');
        
        let existingData = null;
        let checkError = null;
        
        if (!isLocalMatchId) {
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

        // Verify the fixture start time from both sources
        const fixtureStartTime = fixtureStartTimes.get(score.matchId) || score.fixture_start_time;
        console.log(`Fixture start time for ${score.matchId}: ${fixtureStartTime || 'not found'}, score.fixture_start_time: ${score.fixture_start_time || 'not set'}`);

        if (existingData) {
          console.log('Updating existing match data:', existingData.id);
          
          // Make sure to include the fixture time in the update
          const updateData = {
            home_total_points: score.homeScores.reduce((a, b) => a + b, 0),
            away_total_points: score.awayScores.reduce((a, b) => a + b, 0),
            set1_home_score: score.homeScores[0] || 0,
            set1_away_score: score.awayScores[0] || 0,
            set2_home_score: score.homeScores[1] || 0,
            set2_away_score: score.awayScores[1] || 0,
            set3_home_score: score.homeScores[2] || 0,
            set3_away_score: score.awayScores[2] || 0,
            has_final_score: true
          };
          
          // Only add fixture_start_time if we have a valid value
          if (fixtureStartTime) {
            console.log(`Including fixture_start_time in update: ${fixtureStartTime}`);
            updateData['fixture_start_time'] = fixtureStartTime;
          }
          
          const { error: updateError } = await supabase
            .from('match_data_v2')
            .update(updateData)
            .eq('id', existingData.id);

          if (updateError) {
            console.error('Error updating match data:', updateError);
            throw updateError;
          }
        } else {
          console.log('Saving new match data for match:', score.matchId);
          
          const homePointsFor = score.homeScores.reduce((acc, s) => acc + s, 0);
          const awayPointsFor = score.awayScores.reduce((acc, s) => acc + s, 0);

          const homeSetsWon = score.homeScores.reduce((acc, s, index) => 
            acc + (s > score.awayScores[index] ? 1 : 0), 0);
          const awaySetsWon = score.homeScores.reduce((acc, s, index) => 
            acc + (s < score.awayScores[index] ? 1 : 0), 0);

          const getResult = (isHomeTeam: boolean) => {
            const teamSetsWon = isHomeTeam ? homeSetsWon : awaySetsWon;
            const opponentSetsWon = isHomeTeam ? awaySetsWon : homeSetsWon;
            if (teamSetsWon > opponentSetsWon) return 'W';
            if (teamSetsWon < opponentSetsWon) return 'L';
            return 'D';
          };

          const homeBonusPoints = score.homeScores.reduce((total, setScore) => 
            total + Math.floor(setScore / 10), 0);
          const awayBonusPoints = score.awayScores.reduce((total, setScore) => 
            total + Math.floor(setScore / 10), 0);

          const homeMatchPoints = homeBonusPoints + (homeSetsWon * 2);
          const awayMatchPoints = awayBonusPoints + (awaySetsWon * 2);
          
          let homeTeamName = score.homeTeam || "Home Team";
          let awayTeamName = score.awayTeam || "Away Team";
          let courtNumber = 0;
          let division = "Unknown";
          
          if (isLocalMatchId) {
            try {
              const parts = score.matchId.split('_');
              if (parts.length >= 3) {
                courtNumber = parseInt(parts[0].slice(-3)) || 0;
                
                if (!score.homeTeam) {
                  homeTeamName = parts[1].replace(/([A-Z])/g, ' $1').trim();
                }
                
                if (!score.awayTeam) {
                  let awayPart = parts[2];
                  if (awayPart.includes('-')) {
                    awayPart = awayPart.split('-')[0];
                  }
                  awayTeamName = awayPart.replace(/([A-Z])/g, ' $1').trim();
                }
                
                division = "Local Match";
              }
            } catch (error) {
              console.error('Error parsing local match ID:', error);
            }
          } else {
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
                homeTeamName = score.homeTeam || matchData.home_team_name;
                awayTeamName = score.awayTeam || matchData.away_team_name;
                courtNumber = matchData.court_number;
                division = matchData.division || "Unknown";
                if (!fixtureStartTime && matchData.fixture_start_time) {
                  console.log(`Using fixture start time from matches_v2: ${matchData.fixture_start_time}`);
                }
              }
            } catch (error) {
              console.error('Error fetching match details:', error);
            }
          }

          // Create the data object for insertion
          const insertData = {
            match_id: isLocalMatchId ? null : score.matchId,
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
            home_total_points: score.homeScores.reduce((a, b) => a + b, 0),
            away_total_points: score.awayScores.reduce((a, b) => a + b, 0),
            home_result: getResult(true),
            away_result: getResult(false),
            home_bonus_points: homeBonusPoints,
            away_bonus_points: awayBonusPoints,
            home_total_match_points: homeMatchPoints,
            away_total_match_points: awayMatchPoints,
            has_final_score: true
          };
          
          // Only add match_date and fixture_start_time if we have valid values
          if (fixtureStartTime) {
            console.log(`Using fixture start time for new match: ${fixtureStartTime}`);
            insertData['match_date'] = fixtureStartTime;
            insertData['fixture_start_time'] = fixtureStartTime;
          } else {
            insertData['match_date'] = new Date().toISOString();
          }
          
          console.log('Inserting match data with:', insertData);
          const { error: upsertError } = await supabase
            .from('match_data_v2')
            .insert(insertData);

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

/**
 * Save match scores to the database
 * @param matchId Match identifier
 * @param homeScores Array of home team scores
 * @param awayScores Array of away team scores
 * @param submitToSupabase Whether to immediately submit to Supabase
 * @param fixtureTime Formatted fixture time for display (e.g. "22/01/2023 19:00")
 * @param fixture_start_time ISO date string of fixture start time
 * @param homeTeam Home team name
 * @param awayTeam Away team name
 * @returns Result of the operation
 */
export const saveMatchScores = async (
  matchId: string,
  homeScores: number[],
  awayScores: number[],
  submitToSupabase = false,
  fixtureTime?: string,
  fixture_start_time?: string,
  homeTeam?: string,
  awayTeam?: string
) => {
  try {
    console.log('Saving match scores for match:', matchId, {
      homeScores,
      awayScores,
      submitToSupabase,
      fixtureTime,
      fixture_start_time,
      homeTeam,
      awayTeam
    });

    const pendingScore: Omit<PendingScore, 'status'> = {
      id: `${matchId}-${Date.now()}`,
      matchId,
      homeScores,
      awayScores,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      fixtureTime,
      fixture_start_time,
      homeTeam,
      awayTeam
    };

    await savePendingScore(pendingScore);
    console.log('Successfully saved pending score');

    if (submitToSupabase && !isOffline()) {
      return await processPendingScores(true);
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving match scores:', error);
    throw error;
  }
};
