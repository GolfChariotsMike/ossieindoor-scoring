import { useState } from "react";
import { Score, SetScores } from "@/types/volleyball";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const useGameState = () => {
  const [currentScore, setCurrentScore] = useState<Score>({ home: 0, away: 0 });
  const [setScores, setSetScores] = useState<SetScores>({ home: [], away: [] });
  const [isBreak, setIsBreak] = useState(false);
  const [isTeamsSwitched, setIsTeamsSwitched] = useState(false);
  const [isMatchComplete, setIsMatchComplete] = useState(false);
  const [hasGameStarted, setHasGameStarted] = useState(false);
  const { toast } = useToast();

  const handleScore = (team: "home" | "away") => {
    if (isMatchComplete) return;
    setHasGameStarted(true);
    setCurrentScore((prev) => ({
      ...prev,
      [team]: prev[team] + 1,
    }));
  };

  const saveMatchScores = async (matchId: string, homeScores: number[], awayScores: number[]) => {
    if (!hasGameStarted || !homeScores.length || !awayScores.length) {
      return;
    }

    try {
      // First, get existing scores for this match
      const { data: existingScores } = await supabase
        .from('match_scores')
        .select('*')
        .eq('match_id', matchId);

      // Prepare the scores data
      const setScoresData = homeScores.map((homeScore, index) => ({
        match_id: matchId,
        set_number: index + 1,
        home_score: homeScore,
        away_score: awayScores[index]
      }));

      // For each set score, either update existing or insert new
      for (const scoreData of setScoresData) {
        const existingScore = existingScores?.find(
          score => score.match_id === matchId && score.set_number === scoreData.set_number
        );

        if (existingScore) {
          // Update existing score
          const { error: updateError } = await supabase
            .from('match_scores')
            .update({
              home_score: scoreData.home_score,
              away_score: scoreData.away_score
            })
            .eq('match_id', matchId)
            .eq('set_number', scoreData.set_number);

          if (updateError) throw updateError;
        } else {
          // Insert new score
          const { error: insertError } = await supabase
            .from('match_scores')
            .insert([scoreData]);

          if (insertError) throw insertError;
        }
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

  const handleTimerComplete = () => {
    if (!hasGameStarted || (currentScore.home === 0 && currentScore.away === 0)) {
      return;
    }

    if (isBreak) {
      setIsBreak(false);
      setCurrentScore({ home: 0, away: 0 });
      handleSwitchTeams();
      
      if (!isMatchComplete) {
        toast({
          title: "Break Time Over",
          description: "Starting next set",
        });
      }
    } else {
      const newSetScores = {
        home: [...setScores.home, isTeamsSwitched ? currentScore.away : currentScore.home],
        away: [...setScores.away, isTeamsSwitched ? currentScore.home : currentScore.away],
      };
      
      setSetScores(newSetScores);
      setIsBreak(true);
      
      if (newSetScores.home.length >= 3) {
        setIsMatchComplete(true);
        toast({
          title: "Match Complete",
          description: "The match has ended",
        });
      } else {
        toast({
          title: "Set Complete",
          description: "Starting 1 minute break",
        });
      }
    }
  };

  const handleSwitchTeams = () => {
    if (isMatchComplete) return;
    setIsTeamsSwitched(!isTeamsSwitched);
    setCurrentScore((prev) => ({
      home: prev.away,
      away: prev.home
    }));
  };

  return {
    currentScore,
    setScores,
    isBreak,
    isTeamsSwitched,
    isMatchComplete,
    hasGameStarted,
    handleScore,
    handleTimerComplete,
    handleSwitchTeams,
    saveMatchScores,
  };
};