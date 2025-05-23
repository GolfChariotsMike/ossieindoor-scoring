
import { useState, useCallback } from 'react';
import { Score, Match, Fixture } from '@/types/volleyball';
import { useScoring } from './useScoring';
import { saveMatchScores } from '@/utils/matchDatabase';
import { enableForcedOfflineMode, isOffline } from '@/utils/offlineMode';

export const useGameState = () => {
  const [isBreak, setIsBreak] = useState(false);
  const [hasInitializedPhases, setHasInitializedPhases] = useState(false);
  const [hasEnabledOfflineMode, setHasEnabledOfflineMode] = useState(false);
  
  const { 
    currentScore, 
    setCurrentScore,
    isTeamsSwitched,
    setIsTeamsSwitched,
    hasGameStarted,
    setHasGameStarted,
    firstSetRecorded,
    setFirstSetRecorded,
    isMatchComplete,
    setIsMatchComplete,
    handleScore: _handleScore,
    handleSwitchTeams,
    setSetScores,
    setScores,
    setScores: _setScores
  } = useScoring();

  // Handle score with match data
  const handleScore = useCallback((team: "home" | "away", increment: boolean, match?: Match) => {
    if (!hasInitializedPhases) {
      setHasInitializedPhases(true);
      
      // Enable offline mode on first score if not already offline
      if (!hasEnabledOfflineMode && !isOffline()) {
        console.log('First score recorded - enabling offline mode');
        enableForcedOfflineMode();
        setHasEnabledOfflineMode(true);
      }
    }
    
    // Allow scoring regardless of whether it's a break or not
    _handleScore(team, increment, match);
  }, [_handleScore, hasInitializedPhases, hasEnabledOfflineMode]);

  // Handle timer complete
  const handleTimerComplete = useCallback(() => {
    if (isBreak) {
      // When the break is over, we transition to the next set
      setIsBreak(false);
      
      // Save the current scores to the set scores
      const newSetScores = {
        home: [...setScores.home, isTeamsSwitched ? currentScore.away : currentScore.home],
        away: [...setScores.away, isTeamsSwitched ? currentScore.home : currentScore.away],
      };
      
      setSetScores(newSetScores);
      
      // Reset scores for the next set
      setCurrentScore({ home: 0, away: 0 });
      
      // Switch teams for the next set
      handleSwitchTeams();
      
      if (newSetScores.home.length >= 3) {
        setIsMatchComplete(true);
        console.log('Match complete after break, all sets finished');
      } else {
        console.log('Break over, new set starting');
      }
    } else {
      // Only proceed if there are actual scores
      if (currentScore.home === 0 && currentScore.away === 0) {
        return;
      }

      // Set is complete, start a break
      setIsBreak(true);
      console.log('Set complete, starting break. Scores will continue to be tracked during break.');
    }
  }, [
    isBreak, 
    setIsBreak, 
    isMatchComplete, 
    setIsMatchComplete, 
    currentScore, 
    setCurrentScore, 
    setScores, 
    setSetScores,
    isTeamsSwitched, 
    handleSwitchTeams
  ]);

  // Save match scores to database (modified to always use local storage first)
  const saveMatchScoresToDatabase = useCallback(async (matchId: string, homeScores: number[], awayScores: number[]) => {
    try {
      console.log('Saving match scores to database:', {
        matchId,
        homeScores,
        awayScores
      });
      // Always pass false for submitToSupabase parameter - we'll only submit at the end of the night
      return await saveMatchScores(matchId, homeScores, awayScores, false);
    } catch (error) {
      console.error('Error in saveMatchScoresToDatabase:', error);
      throw error;
    }
  }, []);

  // Save scores locally without submitting to Supabase
  const saveScoresLocally = useCallback(async (matchId: string, homeScores: number[], awayScores: number[], fixtureData?: Fixture) => {
    try {
      console.log('Saving scores locally only:', {
        matchId,
        homeScores, 
        awayScores,
        isTeamsSwitched,
        fixtureTime: fixtureData?.DateTime,
        fixture_start_time: fixtureData?.fixture_start_time || fixtureData?.DateTime
      });

      // IMPORTANT: We do NOT adjust based on isTeamsSwitched here - the scores are already
      // in the right orientation in the UI, but need to be swapped when saving
      // This is where the orientation issue is happening
      
      // Extract fixture data if provided
      const fixtureTime = fixtureData?.DateTime;
      const fixture_start_time = fixtureData?.fixture_start_time || fixtureData?.DateTime;
      const homeTeam = fixtureData?.HomeTeam;
      const awayTeam = fixtureData?.AwayTeam;
      
      // Save to IndexedDB but don't submit to Supabase yet
      return await saveMatchScores(
        matchId, 
        homeScores, 
        awayScores, 
        false, 
        fixtureTime, 
        fixture_start_time,
        homeTeam,
        awayTeam
      );
    } catch (error) {
      console.error('Error in saveScoresLocally:', error);
      throw error;
    }
  }, [isTeamsSwitched]);

  // Reset game state for new match
  const resetGameState = useCallback(() => {
    setCurrentScore({ home: 0, away: 0 });
    setSetScores({ home: [], away: [] });
    setIsTeamsSwitched(false);
    setHasGameStarted(false);
    setFirstSetRecorded(false);
    setIsMatchComplete(false);
    setIsBreak(false);
    setHasInitializedPhases(false);
    setHasEnabledOfflineMode(false);
  }, [setCurrentScore, setSetScores, setIsTeamsSwitched, setHasGameStarted, setFirstSetRecorded, setIsMatchComplete]);

  return {
    currentScore,
    setScores,
    isTeamsSwitched,
    hasGameStarted,
    firstSetRecorded,
    isMatchComplete,
    isBreak,
    handleScore,
    handleTimerComplete,
    handleSwitchTeams,
    saveMatchScores: saveMatchScoresToDatabase,
    saveScoresLocally,
    resetGameState
  };
};
