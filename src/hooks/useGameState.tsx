import { useState } from "react";
import { Score, SetScores } from "@/types/volleyball";
import { handleTimerComplete as handleTimerLogic, isMatchCompleted } from "@/utils/scoringLogic";
import { saveMatchScores } from "@/utils/matchDatabase";

export const useGameState = () => {
  const [currentScore, setCurrentScore] = useState<Score>({ home: 0, away: 0 });
  const [setScores, setSetScores] = useState<SetScores>({ home: [], away: [] });
  const [isBreak, setIsBreak] = useState(false);
  const [isTeamsSwitched, setIsTeamsSwitched] = useState(false);
  const [isMatchComplete, setIsMatchComplete] = useState(false);
  const [hasGameStarted, setHasGameStarted] = useState(false);

  const handleScore = (team: "home" | "away", increment: boolean) => {
    if (isMatchComplete) return;
    setHasGameStarted(true);
    setCurrentScore((prev) => ({
      ...prev,
      [team]: increment ? prev[team] + 1 : Math.max(0, prev[team] - 1),
    }));
  };

  const handleTimerComplete = () => {
    const result = handleTimerLogic(
      isBreak,
      currentScore,
      setScores,
      isTeamsSwitched,
      hasGameStarted
    );

    setIsBreak(result.newIsBreak);
    
    if (result.newSetScores) {
      setSetScores(result.newSetScores);
    }
    
    if (result.shouldSwitchTeams) {
      handleSwitchTeams();
    } else if (!isBreak) {
      setCurrentScore({ home: 0, away: 0 });
    }

    setIsMatchComplete(result.isMatchComplete);
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
