
import { useState, useCallback } from 'react';
import { Score, SetScores, Match } from '@/types/volleyball';
import { useScoring } from './useScoring';
import { saveMatchScores } from '@/utils/matchDatabase';

export const useGameState = () => {
  const [isBreak, setIsBreak] = useState(false);
  const [hasInitializedPhases, setHasInitializedPhases] = useState(false);
  
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
    setScores: _setSetScores,
    setScores
  } = useScoring();

  // Handle score with match data
  const handleScore = useCallback((team: "home" | "away", increment: boolean, match?: Match) => {
    if (!hasInitializedPhases) {
      setHasInitializedPhases(true);
    }
    
    _handleScore(team, increment, match);
  }, [_handleScore, hasInitializedPhases]);

  // Handle timer complete
  const handleTimerComplete = useCallback(() => {
    if (isBreak) {
      setIsBreak(false);
      setCurrentScore({ home: 0, away: 0 });
      handleSwitchTeams(); // Switch teams on each new set
      
      if (!isMatchComplete) {
        console.log('Break over, new set starting');
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
      
      _setSetScores(newSetScores);
      setIsBreak(true);
      
      if (newSetScores.home.length >= 3) {
        setIsMatchComplete(true);
        console.log('Match complete, all sets finished');
      } else {
        console.log('Set complete, starting break');
      }
    }
  }, [
    isBreak, 
    setIsBreak, 
    isMatchComplete, 
    setIsMatchComplete, 
    currentScore, 
    setCurrentScore, 
    setScores, 
    _setSetScores,
    isTeamsSwitched, 
    handleSwitchTeams
  ]);

  // Save match scores to Supabase
  const saveMatchScoresToDatabase = useCallback(async (matchId: string, homeScores: number[], awayScores: number[]) => {
    // Pass false for submitToSupabase parameter - we'll only submit at the end of the night
    return saveMatchScores(matchId, homeScores, awayScores, false);
  }, []);

  // Save scores locally without submitting to Supabase
  const saveScoresLocally = useCallback(async (matchId: string, homeScores: number[], awayScores: number[]) => {
    console.log('Saving scores locally only:', {
      matchId,
      homeScores, 
      awayScores,
      isTeamsSwitched
    });

    // Adjust scores based on whether teams are switched
    const finalHomeScores = isTeamsSwitched ? awayScores : homeScores;
    const finalAwayScores = isTeamsSwitched ? homeScores : awayScores;
    
    // Save to IndexedDB but don't submit to Supabase yet
    return saveMatchScores(matchId, finalHomeScores, finalAwayScores, false);
  }, [isTeamsSwitched]);

  // Reset game state for new match
  const resetGameState = useCallback(() => {
    setCurrentScore({ home: 0, away: 0 });
    _setSetScores({ home: [], away: [] });
    setIsTeamsSwitched(false);
    setHasGameStarted(false);
    setFirstSetRecorded(false);
    setIsMatchComplete(false);
    setIsBreak(false);
    setHasInitializedPhases(false);
  }, [setCurrentScore, _setSetScores, setIsTeamsSwitched, setHasGameStarted, setFirstSetRecorded, setIsMatchComplete]);

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
