
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

    // Calculate bonus points per set (1 point for scoring 10+ points in a set)
    const homeBonusPoints = homeScores.reduce((acc, score) => 
      acc + (score >= 10 ? 1 : 0), 0);
    const awayBonusPoints = awayScores.reduce((acc, score) => 
      acc + (score >= 10 ? 1 : 0), 0);

    // Calculate sets won
    const homeSetsWon = homeScores.reduce((acc, score, index) => 
      acc + (score > awayScores[index] ? 1 : 0), 0);
    const awaySetsWon = homeScores.reduce((acc, score, index) => 
      acc + (score < awayScores[index] ? 1 : 0), 0);

    // Calculate match points (2 points per set won + bonus points)
    const homeMatchPoints = (homeSetsWon * 2) + homeBonusPoints;
    const awayMatchPoints = (awaySetsWon * 2) + awayBonusPoints;

    // Determine match result
    const getResult = (isHomeTeam: boolean) => {
      const teamSetsWon = isHomeTeam ? homeSetsWon : awaySetsWon;
      const opponentSetsWon = isHomeTeam ? awaySetsWon : homeSetsWon;
      if (teamSetsWon > opponentSetsWon) return 'W';
      if (teamSetsWon < opponentSetsWon) return 'L';
      return 'D';
    };

    // Check for existing match data
    const { data: existingData } = await supabase
      .from('match_data_v2')
      .select('id')
      .eq('match_id', matchId)
      .is('deleted_at', null)
      .maybeSingle();

    if (existingData) {
      // Soft delete the existing record
      const { error: deleteError } = await supabase
        .from('match_data_v2')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', existingData.id);

      if (deleteError) throw deleteError;
    }

    // Insert new record
    const { error: insertError } = await supabase
      .from('match_data_v2')
      .insert({
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
        home_total_points: homeScores.reduce((acc, score) => acc + score, 0),
        away_total_points: awayScores.reduce((acc, score) => acc + score, 0),
        home_result: getResult(true),
        away_result: getResult(false),
        home_bonus_points: homeBonusPoints,
        away_bonus_points: awayBonusPoints,
        home_total_match_points: homeMatchPoints,
        away_total_match_points: awayMatchPoints,
        match_date: matchData.start_time
      });

    if (insertError) throw insertError;

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
