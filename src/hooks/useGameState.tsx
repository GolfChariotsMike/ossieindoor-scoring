
import { useState, useCallback } from "react";
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

  const resetGameState = useCallback(() => {
    setCurrentScore({ home: 0, away: 0 });
    setSetScores({ home: [], away: [] });
    setIsBreak(false);
    setIsTeamsSwitched(false);
    setIsMatchComplete(false);
    setHasGameStarted(false);
    setFirstSetRecorded(false);
  }, [setCurrentScore, setSetScores, setIsTeamsSwitched, setIsMatchComplete, setHasGameStarted, setFirstSetRecorded]);

  const handleTimerComplete = useCallback((match?: Match | Fixture) => {
    if (!hasGameStarted || isMatchComplete) {
      return;
    }

    if (isBreak) {
      // End of break
      const newSetScores = {
        home: [...setScores.home, isTeamsSwitched ? currentScore.away : currentScore.home],
        away: [...setScores.away, isTeamsSwitched ? currentScore.home : currentScore.away],
      };
      
      setSetScores(newSetScores);
      setIsBreak(false);
      setCurrentScore({ home: 0, away: 0 });
      
      if (isMatchCompleted(newSetScores)) {
        setIsMatchComplete(true);
        
        if (match) {
          saveMatchScores(match.id, newSetScores.home, newSetScores.away)
            .catch(error => {
              console.error('Background score saving error:', error);
              toast({
                title: "Connection Issues",
                description: "Scores saved locally and will be uploaded when connection is restored.",
                variant: "default",
              });
            });
        }
        
        toast({
          title: "Match Complete",
          description: "The match has ended",
        });
      } else {
        handleSwitchTeams();
        toast({
          title: "Break Time Over",
          description: "Starting next set",
        });
      }
    } else {
      // End of set
      if (currentScore.home === 0 && currentScore.away === 0) {
        return;
      }

      setIsBreak(true);
      toast({
        title: "Set Complete",
        description: "Starting break",
      });
    }
  }, [
    hasGameStarted,
    isMatchComplete,
    isBreak,
    currentScore,
    setScores,
    isTeamsSwitched,
    setSetScores,
    setIsBreak,
    setCurrentScore,
    setIsMatchComplete,
    handleSwitchTeams
  ]);

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
