import { supabase } from "@/integrations/supabase/client";
import { SetScores } from "@/types/volleyball";
import { toast } from "@/components/ui/use-toast";

export const saveMatchScores = async (
  matchId: string, 
  homeScores: number[], 
  awayScores: number[]
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

    // Calculate total points
    const homePointsFor = homeScores.reduce((acc, score) => acc + score, 0);
    const awayPointsFor = awayScores.reduce((acc, score) => acc + score, 0);

    // Calculate match results
    const getMatchResult = (isHomeTeam: boolean) => {
      const teamSetsWon = isHomeTeam ? homeSetsWon : awaySetsWon;
      const opponentSetsWon = isHomeTeam ? awaySetsWon : homeSetsWon;
      if (teamSetsWon > opponentSetsWon) return 'W';
      if (teamSetsWon < opponentSetsWon) return 'L';
      return 'D';
    };

    // Save home team results to results_v3
    const { data: existingHomeResult } = await supabase
      .from('results_v3')
      .select('id')
      .eq('match_id', matchId)
      .eq('team_name', matchData.home_team_name)
      .single();

    if (existingHomeResult) {
      const { error: homeUpdateError } = await supabase
        .from('results_v3')
        .update({
          set1_points_for: homeScores[0] || 0,
          set1_points_against: awayScores[0] || 0,
          set2_points_for: homeScores[1] || 0,
          set2_points_against: awayScores[1] || 0,
          set3_points_for: homeScores[2] || 0,
          set3_points_against: awayScores[2] || 0,
          total_points_for: homePointsFor,
          total_points_against: awayPointsFor,
          match_result: getMatchResult(true)
        })
        .eq('id', existingHomeResult.id);

      if (homeUpdateError) throw homeUpdateError;
    } else {
      const { error: homeResultError } = await supabase
        .from('results_v3')
        .insert([{
          match_id: matchId,
          team_name: matchData.home_team_name,
          is_home_team: true,
          division: matchData.division,
          set1_points_for: homeScores[0] || 0,
          set1_points_against: awayScores[0] || 0,
          set2_points_for: homeScores[1] || 0,
          set2_points_against: awayScores[1] || 0,
          set3_points_for: homeScores[2] || 0,
          set3_points_against: awayScores[2] || 0,
          total_points_for: homePointsFor,
          total_points_against: awayPointsFor,
          match_result: getMatchResult(true)
        }]);

      if (homeResultError) throw homeResultError;
    }

    // Save away team results to results_v3
    const { data: existingAwayResult } = await supabase
      .from('results_v3')
      .select('id')
      .eq('match_id', matchId)
      .eq('team_name', matchData.away_team_name)
      .single();

    if (existingAwayResult) {
      const { error: awayUpdateError } = await supabase
        .from('results_v3')
        .update({
          set1_points_for: awayScores[0] || 0,
          set1_points_against: homeScores[0] || 0,
          set2_points_for: awayScores[1] || 0,
          set2_points_against: homeScores[1] || 0,
          set3_points_for: awayScores[2] || 0,
          set3_points_against: homeScores[2] || 0,
          total_points_for: awayPointsFor,
          total_points_against: homePointsFor,
          match_result: getMatchResult(false)
        })
        .eq('id', existingAwayResult.id);

      if (awayUpdateError) throw awayUpdateError;
    } else {
      const { error: awayResultError } = await supabase
        .from('results_v3')
        .insert([{
          match_id: matchId,
          team_name: matchData.away_team_name,
          is_home_team: false,
          division: matchData.division,
          set1_points_for: awayScores[0] || 0,
          set1_points_against: homeScores[0] || 0,
          set2_points_for: awayScores[1] || 0,
          set2_points_against: homeScores[1] || 0,
          set3_points_for: awayScores[2] || 0,
          set3_points_against: homeScores[2] || 0,
          total_points_for: awayPointsFor,
          total_points_against: homePointsFor,
          match_result: getMatchResult(false)
        }]);

      if (awayResultError) throw awayResultError;
    }

    // Check for existing match result and update if exists
    const { data: existingMatchResult } = await supabase
      .from('match_results')
      .select('id')
      .eq('match_id', matchId)
      .single();

    if (existingMatchResult) {
      const { error: resultUpdateError } = await supabase
        .from('match_results')
        .update({
          home_team_sets: homeSetsWon,
          away_team_sets: awaySetsWon,
          set_scores: setScoresJson
        })
        .eq('id', existingMatchResult.id);

      if (resultUpdateError) throw resultUpdateError;
    } else {
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
    }

    // Check for existing simplified results and update if exists
    const { data: existingHomeSimplified } = await supabase
      .from('match_results_simplified')
      .select('id')
      .eq('match_id', matchId)
      .eq('team_name', matchData.home_team_name)
      .single();

    if (existingHomeSimplified) {
      const { error: homeSimplifiedUpdateError } = await supabase
        .from('match_results_simplified')
        .update({
          set1_points: homeScores[0] || 0,
          set2_points: homeScores[1] || 0,
          set3_points: homeScores[2] || 0,
          total_set_points: homeSetsWon * 2,
          bonus_points: Math.floor(homePointsFor / 10),
          total_points: (homeSetsWon * 2) + Math.floor(homePointsFor / 10),
          points_for: homePointsFor,
          points_against: awayPointsFor,
          total_set_points_against: awaySetsWon * 2
        })
        .eq('id', existingHomeSimplified.id);

      if (homeSimplifiedUpdateError) throw homeSimplifiedUpdateError;
    } else {
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
          total_set_points: homeSetsWon * 2,
          bonus_points: Math.floor(homePointsFor / 10),
          total_points: (homeSetsWon * 2) + Math.floor(homePointsFor / 10),
          points_for: homePointsFor,
          points_against: awayPointsFor,
          total_set_points_against: awaySetsWon * 2
        }]);

      if (homeSimplifiedError) throw homeSimplifiedError;
    }

    const { data: existingAwaySimplified } = await supabase
      .from('match_results_simplified')
      .select('id')
      .eq('match_id', matchId)
      .eq('team_name', matchData.away_team_name)
      .single();

    if (existingAwaySimplified) {
      const { error: awaySimplifiedUpdateError } = await supabase
        .from('match_results_simplified')
        .update({
          set1_points: awayScores[0] || 0,
          set2_points: awayScores[1] || 0,
          set3_points: awayScores[2] || 0,
          total_set_points: awaySetsWon * 2,
          bonus_points: Math.floor(awayPointsFor / 10),
          total_points: (awaySetsWon * 2) + Math.floor(awayPointsFor / 10),
          points_for: awayPointsFor,
          points_against: homePointsFor,
          total_set_points_against: homeSetsWon * 2
        })
        .eq('id', existingAwaySimplified.id);

      if (awaySimplifiedUpdateError) throw awaySimplifiedUpdateError;
    } else {
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
          total_set_points: awaySetsWon * 2,
          bonus_points: Math.floor(awayPointsFor / 10),
          total_points: (awaySetsWon * 2) + Math.floor(awayPointsFor / 10),
          points_for: awayPointsFor,
          points_against: homePointsFor,
          total_set_points_against: homeSetsWon * 2
        }]);

      if (awaySimplifiedError) throw awaySimplifiedError;
    }

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