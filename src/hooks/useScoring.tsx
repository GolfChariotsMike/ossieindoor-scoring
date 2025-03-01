
import { useState, useCallback } from "react";
import { Score, SetScores, Match, Fixture } from "@/types/volleyball";
import { savePendingScore } from "@/services/indexedDB";

export const useScoring = () => {
  const [currentScore, setCurrentScore] = useState<Score>({ home: 0, away: 0 });
  const [setScores, setSetScores] = useState<SetScores>({ home: [], away: [] });
  const [isTeamsSwitched, setIsTeamsSwitched] = useState(false);
  const [hasGameStarted, setHasGameStarted] = useState(false);
  const [firstSetRecorded, setFirstSetRecorded] = useState(false);
  const [isMatchComplete, setIsMatchComplete] = useState(false);
  const [isProcessingScore, setIsProcessingScore] = useState(false);

  const handleScore = useCallback((team: "home" | "away", increment: boolean, match?: Match | Fixture) => {
    if (isMatchComplete || isProcessingScore) {
      return;
    }

    try {
      setIsProcessingScore(true);
      
      const wasGameStarted = hasGameStarted;
      setHasGameStarted(true);
      
      setCurrentScore((prev) => ({
        ...prev,
        [team]: increment ? prev[team] + 1 : Math.max(0, prev[team] - 1),
      }));
      
      if (!wasGameStarted && increment && match) {
        // Just record first set progress without submitting to database
        Promise.resolve().then(async () => {
          try {
            await savePendingScore({
              id: `${match.id}-${Date.now()}`,
              matchId: match.id,
              homeScores: [team === 'home' ? 1 : 0],
              awayScores: [team === 'away' ? 1 : 0],
              timestamp: new Date().toISOString(),
              retryCount: 0
            });
            
            // Only locally, don't submit to Supabase
            setFirstSetRecorded(true);
          } catch (error) {
            console.error('Error in score handling:', error);
          }
        });
      }
    } finally {
      setIsProcessingScore(false);
    }
  }, [isMatchComplete, isProcessingScore, hasGameStarted]);

  const handleSwitchTeams = useCallback(() => {
    if (!isMatchComplete) {
      setIsTeamsSwitched(!isTeamsSwitched);
      setCurrentScore((prev) => ({
        home: prev.away,
        away: prev.home
      }));
    }
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
