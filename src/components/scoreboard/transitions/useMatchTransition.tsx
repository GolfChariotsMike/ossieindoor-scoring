
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Fixture } from "@/types/volleyball";
import { toast } from "@/hooks/use-toast";
import { useGameState } from "@/hooks/useGameState";
import { useNextMatch } from "../NextMatchLogic";
import { processPendingScores } from "@/utils/matchDatabase";

type GameState = ReturnType<typeof useGameState>;

interface UseMatchTransitionProps {
  courtId: string;
  fixture?: Fixture;
  gameState: GameState;
  match: any;
  nextMatches: Fixture[];
  refetchMatches: () => Promise<any>;
  setShowEndOfNightSummary: (show: boolean) => void;
  resultsDuration: number;
}

export const useMatchTransition = ({
  courtId,
  fixture,
  gameState,
  match,
  nextMatches,
  refetchMatches,
  setShowEndOfNightSummary,
  resultsDuration
}: UseMatchTransitionProps) => {
  const navigate = useNavigate();
  const [resultsDisplayStartTime, setResultsDisplayStartTime] = useState<number | null>(null);
  const [preloadedNextMatch, setPreloadedNextMatch] = useState<Fixture | null>(null);
  const [isNextMatchReady, setIsNextMatchReady] = useState<boolean>(false);
  
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTransitioningToResults = useRef<boolean>(false);
  const transitionErrorCount = useRef<number>(0);
  const hasTriedRefetchingMatches = useRef<boolean>(false);
  const isSearchingNextMatch = useRef<boolean>(false);
  const hasSetupTransitionTimer = useRef<boolean>(false);
  
  const { findNextMatch, handleStartNextMatch } = useNextMatch(courtId!, fixture);

  const handleEndOfNight = async () => {
    console.log('No next match found, auto-saving pending scores');
    
    try {
      toast({
        title: "Uploading Scores",
        description: "Saving all pending match scores...",
      });

      const count = await processPendingScores(true);
      
      if (count > 0) {
        toast({
          title: "Scores Saved",
          description: `Successfully uploaded ${count} match score${count > 1 ? 's' : ''}.`,
        });
      } else {
        toast({
          title: "All Scores Current",
          description: "No pending scores needed to be uploaded.",
        });
      }
      
      // Navigate back to court selection
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      console.error("Error uploading scores:", error);
      toast({
        title: "Error Saving Scores",
        description: "Failed to upload scores. Please check your connection.",
        variant: "destructive",
      });
      
      // Still navigate back after error
      setTimeout(() => {
        navigate('/');
      }, 2000);
    }
  };

  useEffect(() => {
    if (gameState.isMatchComplete && match && gameState.hasGameStarted && !isTransitioningToResults.current) {
      console.log('Match complete, preparing for results screen');
      isTransitioningToResults.current = true;

      // Only save scores locally now, not to Supabase
      setTimeout(() => {
        console.log('Saving match with fixture data:', {
          matchId: match.id,
          fixture: fixture ? {
            DateTime: fixture.DateTime,
            fixture_start_time: fixture.fixture_start_time || fixture.DateTime
          } : 'No fixture data'
        });
        
        const scores = gameState.finalScoresRef.current ?? { home: gameState.setScores.home, away: gameState.setScores.away };
        console.log('Saving final scores:', scores);
        gameState.saveScoresLocally(match.id, scores.home, scores.away, fixture)
          .catch(error => {
            console.error('Error saving match scores locally:', error);
          })
          .finally(() => {
            // Skip results display — go straight to next match
            if (!isSearchingNextMatch.current) {
              preloadNextMatch();
            }
          });
      }, 100);
    }
  }, [gameState.isMatchComplete, match, gameState.hasGameStarted]);

  const preloadNextMatch = async () => {
    if (isSearchingNextMatch.current) return;
    isSearchingNextMatch.current = true;
    
    console.log('Preloading next match data during results display');
    
    try {
      // If we have no matches or they are few, try to refetch once
      if ((nextMatches.length === 0 || nextMatches.filter(m => m.PlayingAreaName === `Court ${courtId}`).length <= 1) 
          && !hasTriedRefetchingMatches.current) {
        
        console.log('Limited or no matches found, attempting to refetch matches data');
        hasTriedRefetchingMatches.current = true;
        
        const refetchResult = await refetchMatches();
        console.log('Refetched matches result:', {
          success: refetchResult.isSuccess,
          matchCount: refetchResult.data?.length || 0
        });
        
        // After refetching, try to find the next match
        const nextMatch = await findNextMatch(refetchResult.data || []);
        
        if (nextMatch) {
          console.log('Preloaded next match after refetching:', nextMatch.Id);
          setPreloadedNextMatch(nextMatch);
          setIsNextMatchReady(true);
          prepareForNextMatch(nextMatch);
        } else {
          console.log('No next match found during preloading');
          setPreloadedNextMatch(null);
        }
      } else {
        // Try to find next match with current match data
        const nextMatch = await findNextMatch(nextMatches);
        
        if (nextMatch) {
          console.log('Preloaded next match:', nextMatch.Id);
          setPreloadedNextMatch(nextMatch);
          setIsNextMatchReady(true);
          prepareForNextMatch(nextMatch);
        } else {
          console.log('No next match found during preloading');
          setPreloadedNextMatch(null);
        }
      }
    } catch (error) {
      console.error('Error in preloading next match:', error);
      setPreloadedNextMatch(null);
    } finally {
      isSearchingNextMatch.current = false;
    }
  };

  const prepareForNextMatch = (nextMatch: Fixture) => {
    if (!nextMatch) return;
    // Go straight to next match — no results display delay
    handleStartNextMatch(nextMatch);
  };

  // Results display removed — transition happens immediately via prepareForNextMatch

  return {
    resultsDisplayStartTime,
    preloadedNextMatch,
    isNextMatchReady,
    setResultsDisplayStartTime
  };
};
