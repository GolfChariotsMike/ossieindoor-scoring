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

    // Save to match_results table
    const { error: resultError } = await supabase
      .from('match_results')
      .upsert([{
        match_id: matchId,
        court_number: matchData.court_number,
        division: matchData.division,
        home_team_name: matchData.home_team_name,
        away_team_name: matchData.away_team_name,
        home_team_sets: homeSetsWon,
        away_team_sets: awaySetsWon,
        set_scores: setScoresJson
      }], {
        onConflict: 'match_id'
      });

    if (resultError) throw resultError;

    // Save individual set scores using upsert
    for (const scoreData of homeScores.map((homeScore, index) => ({
      match_id: matchId,
      set_number: index + 1,
      home_score: homeScore,
      away_score: awayScores[index]
    }))) {
      const { error: scoreError } = await supabase
        .from('match_scores_v2')
        .upsert([scoreData], {
          onConflict: 'match_id,set_number'
        });

      if (scoreError) throw scoreError;
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