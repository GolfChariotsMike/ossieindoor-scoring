
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export const saveMatchScores = async (
  matchId: string, 
  homeScores: number[], 
  awayScores: number[]
) => {
  if (!homeScores.length || !awayScores.length) {
    return;
  }

  console.log('Saving match scores:', {
    matchId,
    homeScores,
    awayScores
  });

  // Call the simplified update_match_scores function
  const { error } = await supabase.rpc('update_match_scores', {
    p_match_id: matchId,
    p_set1_home_score: homeScores[0] || 0,
    p_set1_away_score: awayScores[0] || 0,
    p_set2_home_score: homeScores[1] || 0,
    p_set2_away_score: awayScores[1] || 0,
    p_set3_home_score: homeScores[2] || 0,
    p_set3_away_score: awayScores[2] || 0
  });

  if (error) {
    console.error('Error saving scores:', error);
    toast({
      title: "Error saving scores",
      description: "There was a problem saving the match scores",
      variant: "destructive",
    });
    return;
  }

  toast({
    title: "Success",
    description: "Match scores have been saved",
  });
};
