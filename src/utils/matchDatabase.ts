
import { supabase } from "@/integrations/supabase/client";
import { SetScores } from "@/types/volleyball";
import { toast } from "@/components/ui/use-toast";

export const saveMatchScores = async (
  matchId: string, 
  homeScores: number[], 
  awayScores: number[]
) => {
  if (!matchId || !homeScores.length || !awayScores.length) {
    console.error('Invalid match data:', { matchId, homeScores, awayScores });
    return;
  }

  try {
    console.log('Saving match scores:', { matchId, homeScores, awayScores });
    
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
      awayMatchPoints
    });

    // Prepare match data record
    const matchDataRecord = {
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
      has_final_score: true,
      save_attempted_at: new Date().toISOString()
    };

    // Check for existing match data
    const { data: existingData } = await supabase
      .from('match_data_v2')
      .select('id')
      .eq('match_id', matchId)
      .maybeSingle();

    if (existingData) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('match_data_v2')
        .update(matchDataRecord)
        .eq('id', existingData.id);

      if (updateError) {
        console.error('Error updating match data:', updateError);
        throw updateError;
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('match_data_v2')
        .insert(matchDataRecord);

      if (insertError) {
        console.error('Error inserting match data:', insertError);
        throw insertError;
      }
    }

    console.log('Successfully saved match scores');
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
