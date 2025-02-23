
import { useState, useCallback } from "react";
import { Score, SetScores, Match, Fixture } from "@/types/volleyball";
import { useMatchRecording } from "./useMatchRecording";
import { savePendingScore } from "@/services/indexedDB";

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
      
      // Update the score immediately in the UI
      setCurrentScore((prev) => {
        const newScore = {
          ...prev,
          [team]: increment ? prev[team] + 1 : Math.max(0, prev[team] - 1),
        };
        console.log('Updated score:', newScore);
        return newScore;
      });
      
      if (!wasGameStarted && increment && match) {
        console.log('First point scored, saving to IndexedDB');
        
        // Save to IndexedDB without waiting
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
            
            // Try to record to server in background, but don't block UI
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
                // Error is handled within recordFirstSetProgress and will be retried
              }
            });
          } catch (error) {
            console.error('Error saving to IndexedDB:', error);
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
