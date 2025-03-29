import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { savePendingScore, getPendingScores, removePendingScore, updatePendingScoreStatus } from "@/services/indexedDB";
import { isOffline } from "@/utils/offlineMode";
import { MatchSummary, PendingScore } from "@/services/db/types";
import { parseISO, isValid } from "date-fns";

const MAX_RETRIES = 5;

let isProcessing = false;

const processPendingScores = async (forceProcess = false, matchSummaries?: MatchSummary[]) => {
  if (isProcessing && !forceProcess) {
    console.log('Already processing pending scores, skipping...');
    return 0;
  }

  try {
    isProcessing = true;
    const pendingScores = await getPendingScores();
    console.log('Processing pending scores:', pendingScores.length);
    console.log('First few pendingScores with fixture data:', pendingScores.slice(0, 3).map(score => ({
      id: score.id,
      matchId: score.matchId,
      fixtureTime: score.fixtureTime,
      fixture_start_time: score.fixture_start_time
    })));

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
      console.log('Sample fixture start times:', Array.from(fixtureStartTimes.entries()).slice(0, 3));
    }

    for (const score of pendingScores) {
      try {
        console.log('Processing score:', score.id);
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

        // Get the fixture start time from different sources and ensure it's in ISO format
        let fixtureStartTime = fixtureStartTimes.get(score.matchId) || score.fixture_start_time;
        
        // Convert non-ISO format strings (like "25/03/2025 20:15") to ISO format
        if (fixtureStartTime && !fixtureStartTime.includes('T') && /\d{2}\/\d{2}\/\d{4}/.test(fixtureStartTime)) {
          try {
            // Try to parse the date using date-fns
            const parts = fixtureStartTime.split(' ');
            const datePart = parts[0]; // dd/MM/yyyy
            const timePart = parts.length > 1 ? parts[1] : '00:00'; // HH:mm or default to midnight
            
            const dateParts = datePart.split('/');
            if (dateParts.length === 3) {
              // Create an ISO string manually to avoid parsing issues
              const isoString = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T${timePart}:00`;
              const parsed = new Date(isoString);
              
              if (isValid(parsed)) {
                fixtureStartTime = parsed.toISOString();
                console.log(`Converted fixture time "${datePart} ${timePart}" to ISO: ${fixtureStartTime}`);
              } else {
                console.error(`Failed to parse fixture time: ${fixtureStartTime}`);
                fixtureStartTime = new Date().toISOString(); // Fallback to now
              }
            }
          } catch (error) {
            console.error('Error converting fixture time to ISO:', fixtureStartTime, error);
            fixtureStartTime = new Date().toISOString(); // Fallback to now
          }
        }
        
        console.log(`Fixture start time for ${score.matchId}: ${fixtureStartTime || 'not found'}`);

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
              ...(fixtureStartTime ? { fixture_start_time: fixtureStartTime } : {})
            })
            .eq('id', existingData.id);

          if (updateError) {
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
                  fixtureStartTime = matchData.fixture_start_time;
                }
              }
            } catch (error) {
              console.error('Error fetching match details:', error);
            }
          }

          const { error: upsertError } = await supabase
            .from('match_data_v2')
            .insert({
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
              home_result: score.homeScores.reduce((acc, s, index) => acc + (s > score.awayScores[index] ? 1 : 0), 0) > 
                           score.awayScores.reduce((acc, s, index) => acc + (s > score.homeScores[index] ? 1 : 0), 0) ? 'W' : 'L',
              away_result: score.awayScores.reduce((acc, s, index) => acc + (s > score.homeScores[index] ? 1 : 0), 0) > 
                           score.homeScores.reduce((acc, s, index) => acc + (s > score.awayScores[index] ? 1 : 0), 0) ? 'W' : 'L',
              home_bonus_points: score.homeScores.reduce((total, setScore) => total + Math.floor(setScore / 10), 0),
              away_bonus_points: score.awayScores.reduce((total, setScore) => total + Math.floor(setScore / 10), 0),
              home_total_match_points: score.homeScores.reduce((total, setScore) => total + Math.floor(setScore / 10), 0) + 
                                      (score.homeScores.reduce((acc, s, index) => acc + (s > score.awayScores[index] ? 1 : 0), 0) * 2),
              away_total_match_points: score.awayScores.reduce((total, setScore) => total + Math.floor(setScore / 10), 0) + 
                                      (score.awayScores.reduce((acc, s, index) => acc + (s > score.homeScores[index] ? 1 : 0), 0) * 2),
              match_date: fixtureStartTime || new Date().toISOString(),
              fixture_start_time: fixtureStartTime || null,
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
  fixtureTime?: string,
  fixture_start_time?: string,
  homeTeam?: string,
  awayTeam?: string
) => {
  console.log('Starting saveMatchScores with:', {
    matchId,
    homeScores,
    awayScores,
    fixtureTime,
    fixture_start_time,
    homeTeam,
    awayTeam,
    timestamp: new Date().toISOString(),
    submitToSupabase
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
    // If we have a fixture time in dd/MM/yyyy HH:mm format, convert it to ISO string
    let isoFixtureStartTime = fixture_start_time;
    
    if (fixtureTime && !fixture_start_time && /\d{2}\/\d{2}\/\d{4}/.test(fixtureTime)) {
      try {
        // Try to parse the date using date-fns
        const parts = fixtureTime.split(' ');
        const datePart = parts[0]; // dd/MM/yyyy
        const timePart = parts.length > 1 ? parts[1] : '00:00'; // HH:mm or default to midnight
        
        const dateParts = datePart.split('/');
        if (dateParts.length === 3) {
          // Create an ISO string manually to avoid parsing issues
          const isoString = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}T${timePart}:00`;
          const parsed = new Date(isoString);
          
          if (isValid(parsed)) {
            isoFixtureStartTime = parsed.toISOString();
            console.log(`Converted fixture time "${fixtureTime}" to ISO: ${isoFixtureStartTime}`);
          }
        }
      } catch (error) {
        console.error('Error converting fixture time to ISO:', fixtureTime, error);
      }
    }

    const pendingScore = {
      id: `${matchId}-${Date.now()}`,
      matchId,
      homeScores,
      awayScores,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      fixtureTime,  // Keep the original display format for UI
      fixture_start_time: isoFixtureStartTime, // Use converted ISO format for database
      homeTeam,
      awayTeam
    };
    
    console.log('About to save pending score with fixture data:', {
      id: pendingScore.id,
      fixtureTime: pendingScore.fixtureTime,
      fixture_start_time: pendingScore.fixture_start_time,
      homeTeam: pendingScore.homeTeam,
      awayTeam: pendingScore.awayTeam
    });
    
    await savePendingScore(pendingScore);
    console.log('Pending score saved to IndexedDB successfully');

    if (!submitToSupabase) {
      console.log('Scores saved locally only - will be uploaded at end of night');
      return;
    }

    if (isOffline()) {
      toast({
        title: "You're offline",
        description: "Scores saved locally and will be uploaded when connection is restored.",
        variant: "default",
      });
      return;
    }

    return await processPendingScores(true);
  } catch (error) {
    console.error('Error saving match scores:', error);
    
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
