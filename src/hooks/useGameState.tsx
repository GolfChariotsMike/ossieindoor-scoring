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
      // First, get match details
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

      // Also save individual set scores for backward compatibility
      for (const scoreData of homeScores.map((homeScore, index) => ({
        match_id: matchId,
        set_number: index + 1,
        home_score: homeScore,
        away_score: awayScores[index]
      }))) {
        const { error: scoreError } = await supabase
          .from('match_scores_v2')
          .insert([scoreData]);

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