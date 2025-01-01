import { Score, SetScores } from "@/types/volleyball";
import { toast } from "@/components/ui/use-toast";

export const handleSetCompletion = (
  currentScore: Score,
  setScores: SetScores,
  isTeamsSwitched: boolean
): SetScores => {
  return {
    home: [...setScores.home, isTeamsSwitched ? currentScore.away : currentScore.home],
    away: [...setScores.away, isTeamsSwitched ? currentScore.home : currentScore.away],
  };
};

export const isMatchCompleted = (setScores: SetScores): boolean => {
  return setScores.home.length >= 3;
};

export const handleTimerComplete = (
  isBreak: boolean,
  currentScore: Score,
  setScores: SetScores,
  isTeamsSwitched: boolean,
  hasGameStarted: boolean
): {
  newIsBreak: boolean;
  newSetScores?: SetScores;
  isMatchComplete: boolean;
  shouldSwitchTeams: boolean;
} => {
  if (!hasGameStarted || (currentScore.home === 0 && currentScore.away === 0)) {
    return {
      newIsBreak: isBreak,
      shouldSwitchTeams: false,
      isMatchComplete: false
    };
  }

  if (isBreak) {
    toast({
      title: "Break Time Over",
      description: "Starting next set",
    });
    
    return {
      newIsBreak: false,
      shouldSwitchTeams: true,
      isMatchComplete: false
    };
  } else {
    const newSetScores = handleSetCompletion(currentScore, setScores, isTeamsSwitched);
    const matchComplete = isMatchCompleted(newSetScores);
    
    toast({
      title: matchComplete ? "Match Complete" : "Set Complete",
      description: matchComplete ? "The match has ended" : "Starting 1 minute break",
    });

    return {
      newIsBreak: true,
      newSetScores,
      shouldSwitchTeams: false,
      isMatchComplete: matchComplete
    };
  }
};