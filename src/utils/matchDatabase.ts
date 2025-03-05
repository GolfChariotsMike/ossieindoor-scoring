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
  homeTeamName?: string;
  awayTeamName?: string;
}

const MAX_RETRIES = 5;

let isProcessing = false;

const processPendingScores = async (forceProcess = false) => {
  if (isProcessing && !forceProcess) {
    console.log('Already processing pending scores, skipping...');
    return;
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

    for (const score of pendingScores) {
      try {
        await updatePendingScoreStatus(score.id, 'processing');
        
        if (isOffline()) {
          console.log('No network connection or offline mode enabled, will retry later');
          await updatePendingScoreStatus(score.id, 'pending');
          continue;
        }

        const { data: existingData, error: checkError } = await supabase
          .from('match_data_v2')
          .select()
          .eq('match_id', score.matchId)
          .maybeSingle();

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
              home_team_name: (existingData.home_team_name === 'Home Team' || !existingData.home_team_name) && 
                              score.homeTeamName ? score.homeTeamName : existingData.home_team_name,
              away_team_name: (existingData.away_team_name === 'Away Team' || !existingData.away_team_name) && 
                              score.awayTeamName ? score.awayTeamName : existingData.away_team_name
            })
            .eq('id', existingData.id);

          if (updateError) {
            throw updateError;
          }
        } else {
          console.log('Saving new match data for match:', score.matchId);
          const { data: matchData, error: matchError } = await supabase
            .from('matches_v2')
            .select('*')
            .eq('id', score.matchId)
            .single();

          if (matchError) {
            console.error('Error fetching match:', matchError);
            throw matchError;
          }

          if (!matchData) {
            console.error('No match found with ID:', score.matchId);
            throw new Error('Match not found');
          }

          const homeTeamName = matchData.home_team_name || score.homeTeamName || "Home Team";
          const awayTeamName = matchData.away_team_name || score.awayTeamName || "Away Team";

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

          const { error: upsertError } = await supabase
            .from('match_data_v2')
            .upsert({
              match_id: score.matchId,
              court_number: matchData.court_number,
              division: matchData.division,
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
              match_date: matchData.start_time,
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
  homeTeamName?: string,
  awayTeamName?: string
) => {
  console.log('Starting saveMatchScores with:', {
    matchId,
    homeScores,
    awayScores,
    homeTeamName,
    awayTeamName,
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
    const pendingScore: Omit<PendingScore, 'status'> = {
      id: `${matchId}-${Date.now()}`,
      matchId,
      homeScores,
      awayScores,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      homeTeamName,
      awayTeamName
    };
    await savePendingScore(pendingScore);

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
