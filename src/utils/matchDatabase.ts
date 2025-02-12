
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

  // Start a Supabase transaction
  const { error: transactionError } = await supabase.rpc('handle_match_data_update', {
    p_match_id: matchId as unknown as string,
    p_set1_home_score: homeScores[0] || 0,
    p_set1_away_score: awayScores[0] || 0,
    p_set2_home_score: homeScores[1] || 0,
    p_set2_away_score: awayScores[1] || 0,
    p_set3_home_score: homeScores[2] || 0,
    p_set3_away_score: awayScores[2] || 0
  });

  if (transactionError) {
    console.error('Error in transaction:', transactionError);
    toast({
      title: "Error saving scores",
      description: "There was a problem saving the match scores",
      variant: "destructive",
    });
    return;
  }

  toast({
    title: "Match scores saved",
    description: "The match scores have been successfully recorded",
  });
};
