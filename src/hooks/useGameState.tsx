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
  const { toast } = useToast();

  const handleScore = (team: "home" | "away") => {
    if (isMatchComplete) return;
    setCurrentScore((prev) => ({
      ...prev,
      [team]: prev[team] + 1,
    }));
  };

  const saveMatchScores = async (matchId: string, homeScores: number[], awayScores: number[]) => {
    console.log('Attempting to save scores:', { matchId, homeScores, awayScores });
    
    try {
      // First ensure the match exists
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select()
        .eq('id', matchId)
        .single();

      if (matchError) throw matchError;

      // Prepare set scores data for upsert
      const setScoresData = homeScores.map((homeScore, index) => ({
        match_id: matchId,
        set_number: index + 1,
        home_score: homeScore,
        away_score: awayScores[index]
      }));

      console.log('Upserting scores:', setScoresData);

      const { error: upsertError } = await supabase
        .from('match_scores')
        .upsert(setScoresData, {
          onConflict: 'match_id,set_number'
        });

      if (upsertError) {
        console.error('Error upserting scores:', upsertError);
        throw upsertError;
      }

      toast({
        title: "Match scores saved",
        description: "The match scores have been successfully recorded",
      });

      console.log('Scores saved successfully');
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
    if (isMatchComplete) return;

    if (isBreak) {
      setIsBreak(false);
      setCurrentScore({ home: 0, away: 0 });
      handleSwitchTeams();
      toast({
        title: "Break Time Over",
        description: "Starting next set",
      });
    } else {
      // When saving set scores, we need to account for whether teams are currently switched
      const updatedSetScores = {
        home: [...setScores.home, isTeamsSwitched ? currentScore.away : currentScore.home],
        away: [...setScores.away, isTeamsSwitched ? currentScore.home : currentScore.away],
      };
      
      console.log('Current scores being saved:', currentScore);
      console.log('Updated set scores:', updatedSetScores);
      
      setSetScores(updatedSetScores);
      setIsBreak(true);

      if (updatedSetScores.home.length >= 3) {
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
    
    // Switch current scores
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
    handleScore,
    handleTimerComplete,
    handleSwitchTeams,
    saveMatchScores,
  };
};