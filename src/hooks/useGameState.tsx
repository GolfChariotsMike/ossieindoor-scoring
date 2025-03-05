
import { useState, useCallback } from "react";
import { Score, SetScores, Match } from "@/types/volleyball";
import { toast } from "./use-toast";
import { saveMatchScores } from "@/utils/matchDatabase";

export const useGameState = () => {
  const [currentScore, setCurrentScore] = useState<Score>({ home: 0, away: 0 });
  const [setScores, setSetScores] = useState<SetScores>({ home: [], away: [] });
  const [isBreak, setIsBreak] = useState(false);
  const [isTeamsSwitched, setIsTeamsSwitched] = useState(false);
  const [isMatchComplete, setIsMatchComplete] = useState(false);
  const [hasGameStarted, setHasGameStarted] = useState(false);
  const [finalBreakActive, setFinalBreakActive] = useState(false);
  const [pendingSetScores, setPendingSetScores] = useState<{
    matchId: string;
    homeScores: number[];
    awayScores: number[];
    match?: Match;
  } | null>(null);

  // Initialize game state with match data
  const initializeGameState = useCallback((match: Match) => {
    if (!match) return;
    
    console.log('Initializing game state with match:', match);
    setHasGameStarted(true);
  }, []);

  // Reset game state
  const resetGameState = useCallback(() => {
    console.log('Resetting game state');
    setCurrentScore({ home: 0, away: 0 });
    setSetScores({ home: [], away: [] });
    setIsBreak(false);
    setIsTeamsSwitched(false);
    setIsMatchComplete(false);
    setHasGameStarted(false);
    setFinalBreakActive(false);
    setPendingSetScores(null);
  }, []);

  // Handle score update
  const handleScoreUpdate = useCallback((team: "home" | "away", increment: boolean = true) => {
    if (isMatchComplete) return;
    
    setCurrentScore((prev) => ({
      ...prev,
      [team]: increment ? prev[team] + 1 : Math.max(0, prev[team] - 1),
    }));
    
    setHasGameStarted(true);
  }, [isMatchComplete]);

  // Handle timer completion (end of set or break)
  const handleTimerComplete = useCallback(() => {
    if (isBreak) {
      // End of break
      setIsBreak(false);
      
      // Save any pending set scores now that the break is over
      if (pendingSetScores) {
        console.log('Saving pending set scores after break:', pendingSetScores);
        saveScoresLocally(
          pendingSetScores.matchId,
          pendingSetScores.homeScores,
          pendingSetScores.awayScores,
          pendingSetScores.match
        ).catch(err => console.error('Failed to save scores after break:', err));
        
        // Clear pending scores
        setPendingSetScores(null);
      }
      
      // If this was the final break, now we can mark the match as complete
      if (finalBreakActive) {
        console.log("Final break timer completed - now marking match as complete");
        setIsMatchComplete(true);
        setFinalBreakActive(false);
        toast({
          title: "Match Complete",
          description: "The match has ended",
        });
        return;
      }
      
      setCurrentScore({ home: 0, away: 0 });
      handleSwitchTeams();
      
      if (!isMatchComplete) {
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

      const currentHomeScore = isTeamsSwitched ? currentScore.away : currentScore.home;
      const currentAwayScore = isTeamsSwitched ? currentScore.home : currentScore.away;
      
      const newSetScores = {
        home: [...setScores.home, currentHomeScore],
        away: [...setScores.away, currentAwayScore],
      };
      
      setSetScores(newSetScores);
      setIsBreak(true);
      
      // Determine if we should enter the final break after this set
      const isFinalSet = newSetScores.home.length >= 3;
      
      if (isFinalSet) {
        // If this is the final set, enter final break phase
        console.log("Entering final break phase");
        setFinalBreakActive(true);
        toast({
          title: "Set Complete",
          description: "Starting 1 minute final break",
        });
      } else {
        toast({
          title: "Set Complete",
          description: "Starting 1 minute break",
        });
      }
    }
  }, [isBreak, currentScore, setScores, isTeamsSwitched, isMatchComplete, finalBreakActive, pendingSetScores]);

  // Switch teams (e.g., after a set)
  const handleSwitchTeams = useCallback(() => {
    if (isMatchComplete) return;
    setIsTeamsSwitched(!isTeamsSwitched);
    setCurrentScore((prev) => ({
      home: prev.away,
      away: prev.home
    }));
  }, [isMatchComplete, isTeamsSwitched]);

  // Save current match scores to local storage
  const saveScoresLocally = useCallback(async (matchId: string, homeScores: number[], awayScores: number[], match?: Match) => {
    try {
      // Extract team names from match if available
      const homeTeamName = match?.homeTeam?.name;
      const awayTeamName = match?.awayTeam?.name;
      
      console.log('Saving scores locally with team names:', {
        matchId,
        homeScores,
        awayScores,
        homeTeamName,
        awayTeamName
      });
      
      await saveMatchScores(
        matchId,
        homeScores,
        awayScores,
        false, // Don't immediately submit to Supabase
        homeTeamName,
        awayTeamName
      );
      return true;
    } catch (error) {
      console.error('Error saving scores locally:', error);
      toast({
        title: "Error",
        description: "Failed to save scores locally",
        variant: "destructive",
      });
      return false;
    }
  }, []);

  // Store pending scores to be saved after break
  const storePendingScores = useCallback((matchId: string, homeScores: number[], awayScores: number[], match?: Match) => {
    console.log('Storing pending scores to save after break:', { matchId, homeScores, awayScores });
    setPendingSetScores({
      matchId,
      homeScores,
      awayScores,
      match
    });
  }, []);

  return {
    currentScore,
    setScores,
    isBreak,
    isTeamsSwitched,
    isMatchComplete,
    hasGameStarted,
    finalBreakActive,
    pendingSetScores,
    handleScoreUpdate,
    handleTimerComplete,
    handleSwitchTeams,
    initializeGameState,
    resetGameState,
    saveScoresLocally,
    storePendingScores,
  };
};
