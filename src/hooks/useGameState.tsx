
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
      
      // Determine if match is complete after this set
      const isComplete = newSetScores.home.length >= 3;
      if (isComplete) {
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
  }, [isBreak, currentScore, setScores, isTeamsSwitched, isMatchComplete]);

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

  return {
    currentScore,
    setScores,
    isBreak,
    isTeamsSwitched,
    isMatchComplete,
    hasGameStarted,
    handleScoreUpdate,
    handleTimerComplete,
    handleSwitchTeams,
    initializeGameState,
    resetGameState,
    saveScoresLocally,
  };
};
