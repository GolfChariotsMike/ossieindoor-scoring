
import { useState } from "react";
import { Match, Fixture } from "@/types/volleyball";
import { isMatchCompleted } from "@/utils/scoringLogic";
import { saveMatchScores } from "@/utils/matchDatabase";
import { toast } from "@/hooks/use-toast";
import { useScoring } from "./useScoring";

export const useGameState = () => {
  const [isBreak, setIsBreak] = useState(false);

  const {
    currentScore,
    setCurrentScore,
    setScores,
    isTeamsSwitched,
    setIsTeamsSwitched,
    hasGameStarted,
    setHasGameStarted,
    setFirstSetRecorded,
    isMatchComplete,
    setIsMatchComplete,
    handleScore,
    handleSwitchTeams,
    setSetScores
  } = useScoring();

  const resetGameState = () => {
    console.log('Resetting game state');
    setCurrentScore({ home: 0, away: 0 });
    setSetScores({ home: [], away: [] });
    setIsBreak(false);
    setIsTeamsSwitched(false);
    setIsMatchComplete(false);
    setHasGameStarted(false);
    setFirstSetRecorded(false);
  };

  const handleTimerComplete = (match?: Match | Fixture) => {
    console.log('Timer complete:', {
      match,
      isBreak,
      currentScore,
      setScores,
      isTeamsSwitched,
      hasGameStarted
    });

    if (!hasGameStarted) {
      console.log('Game has not started yet, skipping timer complete handling');
      return;
    }

    if (isBreak) {
      const newSetScores = {
        home: [...setScores.home, isTeamsSwitched ? currentScore.away : currentScore.home],
        away: [...setScores.away, isTeamsSwitched ? currentScore.home : currentScore.away],
      };
      
      console.log('New set scores:', newSetScores);
      setSetScores(newSetScores);
      setIsBreak(false);
      setCurrentScore({ home: 0, away: 0 });
      handleSwitchTeams();
      
      const matchComplete = isMatchCompleted(newSetScores);
      console.log('Match completion check:', { matchComplete, newSetScores });
      setIsMatchComplete(matchComplete);
      
      if (matchComplete && match) {
        console.log('Match complete, saving final scores:', {
          matchId: match.id,
          newSetScores,
          timestamp: new Date().toISOString()
        });
        try {
          saveMatchScores(match.id, newSetScores.home, newSetScores.away);
        } catch (error) {
          console.error('Error while trying to save match scores:', error);
          toast({
            title: "Error Saving Scores",
            description: "There was a problem saving the match scores. Please try again.",
            variant: "destructive",
          });
        }
      }
      
      toast({
        title: matchComplete ? "Match Complete" : "Break Time Over",
        description: matchComplete ? "The match has ended" : "Starting next set",
      });
    } else {
      setIsBreak(true);
      toast({
        title: "Set Complete",
        description: "Starting 1 minute break",
      });
    }
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
    resetGameState,
  };
};
