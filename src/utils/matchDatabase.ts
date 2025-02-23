import { supabase } from "@/integrations/supabase/client";
import { SetScores } from "@/types/volleyball";
import { toast } from "@/components/ui/use-toast";
import { savePendingScore, getPendingScores, removePendingScore, updatePendingScoreStatus } from "@/services/indexedDB";

interface PendingScore {
  id: string;
  matchId: string;
  homeScores: number[];
  awayScores: number[];
  timestamp: string;
  retryCount: number;
  status: 'pending' | 'processing' | 'failed';
}

const MAX_RETRIES = 5;
const RETRY_INTERVAL = 30000; // 30 seconds

let isProcessing = false;

const processPendingScores = async () => {
  if (isProcessing) {
    console.log('Already processing pending scores, skipping...');
    return;
  }

  try {
    isProcessing = true;
    const pendingScores = await getPendingScores();
    console.log('Processing pending scores:', pendingScores.length);

    for (const score of pendingScores) {
      try {
        await updatePendingScoreStatus(score.id, 'processing');
        
        // Check if we have network connectivity
        if (!navigator.onLine) {
          console.log('No network connection, will retry later');
          await updatePendingScoreStatus(score.id, 'pending');
          continue;
        }

        // Check if a record already exists for this match
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
            })
            .eq('id', existingData.id);

          if (updateError) {
            throw updateError;
          }
        } else {
          console.log('Saving new match data for match:', score.matchId);
          await saveMatchScores(score.matchId, score.homeScores, score.awayScores);
        }

        await removePendingScore(score.id);
        console.log('Successfully processed pending score:', score.id);
      } catch (error) {
        console.error('Failed to process pending score:', score.id, error);
        score.retryCount += 1;
        await updatePendingScoreStatus(score.id, score.retryCount >= MAX_RETRIES ? 'failed' : 'pending');
        
        if (score.retryCount >= MAX_RETRIES) {
          console.error('Max retries reached for score:', score.id);
          toast({
            title: "Score Upload Failed",
            description: "Please check your connection and try again later.",
            variant: "destructive",
          });
        }
      }
    }
  } catch (error) {
    console.error('Error processing pending scores:', error);
  } finally {
    isProcessing = false;
  }
};

// Set up periodic check for pending scores
let processingInterval = setInterval(processPendingScores, RETRY_INTERVAL);

// Add network status handlers
window.addEventListener('online', () => {
  console.log('Network connection restored, processing pending scores...');
  processPendingScores();
});

window.addEventListener('offline', () => {
  console.log('Network connection lost, scores will be saved locally');
  toast({
    title: "You're offline",
    description: "Scores will be saved locally and uploaded when connection is restored.",
    variant: "default",
  });
});

export const saveMatchScores = async (
  matchId: string, 
  homeScores: number[], 
  awayScores: number[]
) => {
  console.log('Starting saveMatchScores with:', {
    matchId,
    homeScores,
    awayScores,
    timestamp: new Date().toISOString()
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
    // First, save to IndexedDB as backup
    const pendingScore: Omit<PendingScore, 'status'> = {
      id: `${matchId}-${Date.now()}`,
      matchId,
      homeScores,
      awayScores,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };
    await savePendingScore(pendingScore);

    // If we're offline, don't try to save to Supabase yet
    if (!navigator.onLine) {
      toast({
        title: "You're offline",
        description: "Scores saved locally and will be uploaded when connection is restored.",
        variant: "default",
      });
      return;
    }

    console.log('Fetching match details for ID:', matchId);
    
    // Get match details
    const { data: matchData, error: matchError } = await supabase
      .from('matches_v2')
      .select('*')
      .eq('id', matchId)
      .single();

    if (matchError) {
      console.error('Error fetching match:', matchError);
      throw matchError;
    }

    if (!matchData) {
      console.error('No match found with ID:', matchId);
      throw new Error('Match not found');
    }

    console.log('Found match data:', matchData);

    // Calculate total points
    const homePointsFor = homeScores.reduce((acc, score) => acc + score, 0);
    const awayPointsFor = awayScores.reduce((acc, score) => acc + score, 0);

    // Calculate sets won
    const homeSetsWon = homeScores.reduce((acc, score, index) => 
      acc + (score > awayScores[index] ? 1 : 0), 0);
    const awaySetsWon = homeScores.reduce((acc, score, index) => 
      acc + (score < awayScores[index] ? 1 : 0), 0);

    // Determine match result
    const getResult = (isHomeTeam: boolean) => {
      const teamSetsWon = isHomeTeam ? homeSetsWon : awaySetsWon;
      const opponentSetsWon = isHomeTeam ? awaySetsWon : homeSetsWon;
      if (teamSetsWon > opponentSetsWon) return 'W';
      if (teamSetsWon < opponentSetsWon) return 'L';
      return 'D';
    };

    // Calculate bonus points per set (1 point per 10 points in each set)
    const homeBonusPoints = homeScores.reduce((total, setScore) => 
      total + Math.floor(setScore / 10), 0);
    const awayBonusPoints = awayScores.reduce((total, setScore) => 
      total + Math.floor(setScore / 10), 0);

    // Calculate total match points (bonus points + set points)
    const homeMatchPoints = homeBonusPoints + (homeSetsWon * 2);
    const awayMatchPoints = awayBonusPoints + (awaySetsWon * 2);

    console.log('Match calculations:', {
      homeSetsWon,
      awaySetsWon,
      homePointsFor,
      awayPointsFor,
      homeBonusPoints,
      awayBonusPoints,
      homeMatchPoints,
      awayMatchPoints,
      allScores: {
        home: homeScores,
        away: awayScores
      }
    });

    // Use upsert with match_id as the constraint
    const { error: upsertError } = await supabase
      .from('match_data_v2')
      .upsert({
        match_id: matchId,
        court_number: matchData.court_number,
        division: matchData.division,
        home_team_name: matchData.home_team_name,
        away_team_name: matchData.away_team_name,
        set1_home_score: homeScores[0] || 0,
        set1_away_score: awayScores[0] || 0,
        set2_home_score: homeScores[1] || 0,
        set2_away_score: awayScores[1] || 0,
        set3_home_score: homeScores[2] || 0,
        set3_away_score: awayScores[2] || 0,
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

    // After successful save, update team statistics
    console.log('Match data saved, updating team statistics...');
    try {
      const { error: statsError } = await supabase.rpc('refresh_team_statistics_safe');
      if (statsError) {
        console.error('Error updating team statistics:', statsError);
        
        await supabase.from('crash_logs').insert({
          error_type: 'team_statistics_update_error',
          error_message: statsError.message,
          error_stack: JSON.stringify({
            matchId,
            homeScores,
            awayScores,
            statsError
          }),
          browser_info: {
            userAgent: navigator.userAgent,
            url: window.location.href
          }
        });
        
        toast({
          title: "Warning",
          description: "Match scores saved but team statistics update failed. This will be automatically retried.",
          variant: "destructive",
        });
      } else {
        console.log('Team statistics successfully updated');
        // Remove from pending scores if everything was successful
        await removePendingScore(pendingScore.id);
      }
    } catch (statsError) {
      console.error('Failed to refresh team statistics:', statsError);
      
      await supabase.from('crash_logs').insert({
        error_type: 'team_statistics_update_error',
        error_message: statsError instanceof Error ? statsError.message : 'Unknown error',
        error_stack: JSON.stringify({
          matchId,
          homeScores,
          awayScores,
          statsError
        }),
        browser_info: {
          userAgent: navigator.userAgent,
          url: window.location.href
        }
      });
    }

    console.log('Successfully saved match scores');
    toast({
      title: "Match scores saved",
      description: "The match scores have been successfully recorded",
    });

  } catch (error) {
    console.error('Error saving match scores:', error);
    
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
    
    toast({
      title: "Connection Issues",
      description: "Scores saved locally and will be uploaded when connection is restored.",
      variant: "default",
    });
  }
};
