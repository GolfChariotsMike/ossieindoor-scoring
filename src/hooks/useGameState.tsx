
import { useState, useCallback } from "react";
import { Match, Fixture } from "@/types/volleyball";
import { isMatchCompleted } from "@/utils/scoringLogic";
import { saveMatchScores } from "@/utils/matchDatabase";
import { toast } from "@/hooks/use-toast";
import { useScoring } from "./useScoring";

export const useGameState = () => {
  const [isBreak, setIsBreak] = useState(false);
  const [isProcessingBreak, setIsProcessingBreak] = useState(false);

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
    console.log('Resetting game state');
    setCurrentScore({ home: 0, away: 0 });
    setSetScores({ home: [], away: [] });
    setIsBreak(false);
    setIsProcessingBreak(false);
    setIsTeamsSwitched(false);
    setIsMatchComplete(false);
    setHasGameStarted(false);
    setFirstSetRecorded(false);
  }, [setCurrentScore, setSetScores, setIsTeamsSwitched, setIsMatchComplete, setHasGameStarted, setFirstSetRecorded]);

  const handleTimerComplete = useCallback((match?: Match | Fixture) => {
    if (!hasGameStarted) {
      console.log('Game has not started yet, skipping timer complete handling');
      return;
    }

    if (isProcessingBreak) {
      console.log('Already processing break, skipping...');
      return;
    }

    console.log('Timer complete:', {
      match,
      isBreak,
      currentScore,
      setScores,
      isTeamsSwitched,
      hasGameStarted
    });

    // Use a state flag to prevent multiple simultaneous break processing
    setIsProcessingBreak(true);

    try {
      if (isBreak) {
        // Handle end of break
        const newSetScores = {
          home: [...setScores.home, isTeamsSwitched ? currentScore.away : currentScore.home],
          away: [...setScores.away, isTeamsSwitched ? currentScore.home : currentScore.away],
        };
        
        console.log('New set scores:', newSetScores);
        
        // Update states in a specific order to prevent race conditions
        setSetScores(newSetScores);
        setIsBreak(false);
        setCurrentScore({ home: 0, away: 0 });
        
        const matchComplete = isMatchCompleted(newSetScores);
        console.log('Match completion check:', { matchComplete, newSetScores });
        
        if (matchComplete) {
          setIsMatchComplete(true);
          
          if (match) {
            console.log('Match complete, saving final scores in background:', {
              matchId: match.id,
              newSetScores,
              timestamp: new Date().toISOString()
            });
            
            // Save scores in the background without awaiting
            Promise.resolve().then(() => {
              saveMatchScores(match.id, newSetScores.home, newSetScores.away).catch(error => {
                console.error('Background score saving error:', error);
                // Even if saving fails, it's stored in IndexedDB and will be retried
              });
            });
          }
          
          toast({
            title: "Match Complete",
            description: "The match has ended",
          });
        } else {
          // Only switch teams if the match isn't complete
          handleSwitchTeams();
          
          toast({
            title: "Break Time Over",
            description: "Starting next set",
          });
        }
      } else {
        // Handle start of break
        // Only proceed if there are actual scores
        if (currentScore.home === 0 && currentScore.away === 0) {
          setIsProcessingBreak(false);
          return;
        }

        setIsBreak(true);
        toast({
          title: "Set Complete",
          description: "Starting 1 minute break",
        });
      }
    } catch (error) {
      console.error('Error during break handling:', error);
      toast({
        title: "Error",
        description: "There was a problem processing the game state. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Always reset the processing flag
      setIsProcessingBreak(false);
    }
  }, [
    hasGameStarted, 
    isBreak, 
    isProcessingBreak, 
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
