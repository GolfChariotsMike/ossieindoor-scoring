import { supabase } from "@/integrations/supabase/client";
import { SetScores } from "@/types/volleyball";
import { toast } from "@/components/ui/use-toast";

export const saveMatchScores = async (
  matchId: string, 
  homeScores: number[], 
  awayScores: number[],
  homeStats: { blocks: number; aces: number; blocksAgainst: number },
  awayStats: { blocks: number; aces: number; blocksAgainst: number }
) => {
  if (!homeScores.length || !awayScores.length) {
    return;
  }

  try {
    // Get match details
    const { data: matchData, error: matchError } = await supabase
      .from('matches_v2')
      .select('*')
      .eq('id', matchId)
      .single();

    if (matchError) throw matchError;

    // Format set scores for the new table
    const setScoresJson = homeScores.map((homeScore, index) => ({
      home: homeScore,
      away: awayScores[index]
    }));

    // Calculate total sets won
    const homeSetsWon = homeScores.reduce((acc, score, index) => 
      acc + (score > awayScores[index] ? 1 : 0), 0);
    const awaySetsWon = homeScores.reduce((acc, score, index) => 
      acc + (score < awayScores[index] ? 1 : 0), 0);

    // Calculate total points for and against for each team
    const homePointsFor = homeScores.reduce((sum, score) => sum + score, 0);
    const homePointsAgainst = awayScores.reduce((sum, score) => sum + score, 0);
    const awayPointsFor = homePointsAgainst;
    const awayPointsAgainst = homePointsFor;

    // Save to match_results table
    const { error: resultError } = await supabase
      .from('match_results')
      .insert([{
        match_id: matchId,
        court_number: matchData.court_number,
        division: matchData.division,
        home_team_name: matchData.home_team_name,
        away_team_name: matchData.away_team_name,
        home_team_sets: homeSetsWon,
        away_team_sets: awaySetsWon,
        set_scores: setScoresJson
      }]);

    if (resultError) throw resultError;

    // Calculate bonus points (1 point per 10 points scored)
    const homeBonus = homeScores.reduce((total, score) => total + Math.floor(score / 10), 0);
    const awayBonus = awayScores.reduce((total, score) => total + Math.floor(score / 10), 0);

    // Calculate total set points (2 points per set won)
    const homeSetPoints = homeSetsWon * 2;
    const awaySetPoints = awaySetsWon * 2;

    // Save home team results to match_results_simplified
    const { error: homeSimplifiedError } = await supabase
      .from('match_results_simplified')
      .insert([{
        match_id: matchId,
        team_name: matchData.home_team_name,
        is_home_team: true,
        division: matchData.division,
        set1_points: homeScores[0] || 0,
        set2_points: homeScores[1] || 0,
        set3_points: homeScores[2] || 0,
        total_set_points: homeSetPoints,
        bonus_points: homeBonus,
        total_points: homeSetPoints + homeBonus,
        blocks: homeStats.blocks,
        aces: homeStats.aces,
        blocks_against: homeStats.blocksAgainst,
        points_for: homePointsFor,
        points_against: homePointsAgainst
      }]);

    if (homeSimplifiedError) throw homeSimplifiedError;

    // Save away team results to match_results_simplified
    const { error: awaySimplifiedError } = await supabase
      .from('match_results_simplified')
      .insert([{
        match_id: matchId,
        team_name: matchData.away_team_name,
        is_home_team: false,
        division: matchData.division,
        set1_points: awayScores[0] || 0,
        set2_points: awayScores[1] || 0,
        set3_points: awayScores[2] || 0,
        total_set_points: awaySetPoints,
        bonus_points: awayBonus,
        total_points: awaySetPoints + awayBonus,
        blocks: awayStats.blocks,
        aces: awayStats.aces,
        blocks_against: awayStats.blocksAgainst,
        points_for: awayPointsFor,
        points_against: awayPointsAgainst
      }]);

    if (awaySimplifiedError) throw awaySimplifiedError;

    toast({
      title: "Match scores saved",
      description: "The match scores have been successfully recorded",
    });

  } catch (error) {
    console.error('Error saving match scores:', error);
    toast({
      title: "Error saving scores",
      description: "There was a problem saving the match scores",
      variant: "destructive",
    });
  }
};