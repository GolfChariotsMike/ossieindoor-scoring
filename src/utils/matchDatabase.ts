import { supabase } from "@/integrations/supabase/client";
import { SetScores } from "@/types/volleyball";
import { toast } from "@/components/ui/use-toast";
import { initDB, savePendingScore, getPendingScores, removePendingScore } from "@/services/indexedDB";

interface PendingScore {
  id: string;
  matchId: string;
  homeScores: number[];
  awayScores: number[];
  timestamp: string;
  retryCount: number;
}

const processPendingScores = async () => {
  try {
    const pendingScores = await getPendingScores();
    console.log('Processing pending scores:', pendingScores.length);

    for (const score of pendingScores) {
      try {
        console.log('Attempting to save pending score:', score.id);
        await saveMatchScores(score.matchId, score.homeScores, score.awayScores);
        await removePendingScore(score.id);
        console.log('Successfully processed pending score:', score.id);
      } catch (error) {
        console.error('Failed to process pending score:', score.id, error);
        // Update retry count
        score.retryCount += 1;
        if (score.retryCount > 5) {
          console.error('Max retries reached for score:', score.id);
          await removePendingScore(score.id);
          toast({
            title: "Warning",
            description: "Some scores could not be saved due to connection issues. Please check the match history.",
            variant: "destructive",
          });
        } else {
          // Save the updated retry count
          await savePendingScore(score);
        }
      }
    }
  } catch (error) {
    console.error('Error processing pending scores:', error);
  }
};

// Set up periodic check for pending scores
setInterval(processPendingScores, 30000); // Check every 30 seconds

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
    const pendingScore: PendingScore = {
      id: `${matchId}-${Date.now()}`,
      matchId,
      homeScores,
      awayScores,
      timestamp: new Date().toISOString(),
      retryCount: 0
    };
    await savePendingScore(pendingScore);

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
