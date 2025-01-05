import { useState } from "react";
import { Score, SetScores } from "@/types/volleyball";
import { isMatchCompleted } from "@/utils/scoringLogic";
import { saveMatchScores } from "@/utils/matchDatabase";
import { toast } from "@/components/ui/use-toast";

export const useGameState = () => {
  const [currentScore, setCurrentScore] = useState<Score>({ home: 0, away: 0 });
  const [setScores, setSetScores] = useState<SetScores>({ home: [], away: [] });
  const [isBreak, setIsBreak] = useState(false);
  const [isTeamsSwitched, setIsTeamsSwitched] = useState(false);
  const [isMatchComplete, setIsMatchComplete] = useState(false);
  const [hasGameStarted, setHasGameStarted] = useState(false);
  const [stats, setStats] = useState({
    home: { blocks: 0, aces: 0, blocksAgainst: 0 },
    away: { blocks: 0, aces: 0, blocksAgainst: 0 }
  });

  const resetGameState = () => {
    setCurrentScore({ home: 0, away: 0 });
    setSetScores({ home: [], away: [] });
    setIsBreak(false);
    setIsTeamsSwitched(false);
    setIsMatchComplete(false);
    setHasGameStarted(false);
    setStats({
      home: { blocks: 0, aces: 0, blocksAgainst: 0 },
      away: { blocks: 0, aces: 0, blocksAgainst: 0 }
    });
  };

  const handleScore = (team: "home" | "away", increment: boolean = true) => {
    if (isMatchComplete) return;
    setHasGameStarted(true);
    setCurrentScore((prev) => ({
      ...prev,
      [team]: increment ? prev[team] + 1 : Math.max(0, prev[team] - 1),
    }));
  };

  const handleStat = (team: "home" | "away", type: "block" | "ace") => {
    if (isMatchComplete) return;
    setHasGameStarted(true);
    
    setStats(prev => {
      const newStats = { ...prev };
      if (type === "block") {
        newStats[team].blocks += 1;
        newStats[team === "home" ? "away" : "home"].blocksAgainst += 1;
      } else {
        newStats[team].aces += 1;
      }
      return newStats;
    });
  };

  const handleTimerComplete = () => {
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
      // Only proceed if there are actual scores
      if (currentScore.home === 0 && currentScore.away === 0) {
        return;
      }

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
    setStats(prev => ({
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
    stats,
    handleScore,
    handleStat,
    handleTimerComplete,
    handleSwitchTeams,
    saveMatchScores,
    resetGameState
  };
};