
import { useState, useCallback } from "react";
import { Score, SetScores, Match, Fixture } from "@/types/volleyball";
import { useMatchRecording } from "./useMatchRecording";

export const useScoring = () => {
  const [currentScore, setCurrentScore] = useState<Score>({ home: 0, away: 0 });
  const [setScores, setSetScores] = useState<SetScores>({ home: [], away: [] });
  const [isTeamsSwitched, setIsTeamsSwitched] = useState(false);
  const [hasGameStarted, setHasGameStarted] = useState(false);
  const [firstSetRecorded, setFirstSetRecorded] = useState(false);
  const [isMatchComplete, setIsMatchComplete] = useState(false);
  const [isProcessingScore, setIsProcessingScore] = useState(false);

  const { recordFirstSetProgress } = useMatchRecording(isTeamsSwitched);

  const handleScore = useCallback((team: "home" | "away", increment: boolean, match?: Match | Fixture) => {
    if (isMatchComplete) {
      console.log('Match is complete, ignoring score update');
      return;
    }

    if (isProcessingScore) {
      console.log('Already processing score update, ignoring...');
      return;
    }

    try {
      setIsProcessingScore(true);
      
      const wasGameStarted = hasGameStarted;
      setHasGameStarted(true);
      
      setCurrentScore((prev) => {
        const newScore = {
          ...prev,
          [team]: increment ? prev[team] + 1 : Math.max(0, prev[team] - 1),
        };
        console.log('Updated score:', newScore);
        return newScore;
      });
      
      if (!wasGameStarted && increment && match) {
        console.log('First point scored, recording initial match progress in background');
        // Record first set progress in the background without blocking
        Promise.resolve().then(async () => {
          try {
            const success = await recordFirstSetProgress(match, 
              team === 'home' ? 1 : 0, 
              team === 'away' ? 1 : 0
            );
            if (success) {
              setFirstSetRecorded(true);
            }
          } catch (error) {
            console.error('Background first set recording error:', error);
            // Error is handled within recordFirstSetProgress
          }
        });
      }
    } finally {
      setIsProcessingScore(false);
    }
  }, [isMatchComplete, isProcessingScore, hasGameStarted, setHasGameStarted, recordFirstSetProgress]);

  const handleSwitchTeams = useCallback(() => {
    if (isMatchComplete) {
      console.log('Match is complete, ignoring team switch');
      return;
    }
    console.log('Switching teams');
    setIsTeamsSwitched(!isTeamsSwitched);
    setCurrentScore((prev) => ({
      home: prev.away,
      away: prev.home
    }));
  }, [isMatchComplete, isTeamsSwitched]);

  return {
    currentScore,
    setCurrentScore,
    setScores,
    isTeamsSwitched,
    setIsTeamsSwitched,
    hasGameStarted,
    setHasGameStarted,
    firstSetRecorded,
    setFirstSetRecorded,
    isMatchComplete,
    setIsMatchComplete,
    handleScore,
    handleSwitchTeams,
    setSetScores
  };
};
