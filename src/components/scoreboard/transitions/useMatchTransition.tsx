
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
      isTransitioningToResults.current = true;

      // Capture nextMatches at the time of completion (not stale closure value)
      const matchesAtCompletion = nextMatches;

      setTimeout(() => {
        
        const scores = gameState.finalScoresRef.current ?? { home: gameState.setScores.home, away: gameState.setScores.away };
        gameState.saveScoresLocally(match.id, scores.home, scores.away, fixture)
          .then(() => {
          })
          .catch(error => {
            console.error('Error saving match scores locally:', error);
          })
          .finally(() => {
            // Skip results display — go straight to next match
            if (!isSearchingNextMatch.current) {
              preloadNextMatch(matchesAtCompletion);
            }
          });
      }, 100);
    }
  }, [gameState.isMatchComplete, match, gameState.hasGameStarted]);

  const preloadNextMatch = async (matchesSnapshot: Fixture[]) => {
    if (isSearchingNextMatch.current) return;
    isSearchingNextMatch.current = true;
    
    
    try {
      let matchesToSearch = matchesSnapshot;

      // If we have no/few matches for this court, try to refetch once
      const courtMatches = matchesToSearch.filter(m => m.PlayingAreaName === `Court ${courtId}`);
      if ((matchesToSearch.length === 0 || courtMatches.length <= 1) && !hasTriedRefetchingMatches.current) {
        hasTriedRefetchingMatches.current = true;
        
        const refetchResult = await refetchMatches();
        matchesToSearch = refetchResult.data || matchesToSearch;
      }

      const nextMatch = await findNextMatch(matchesToSearch);
      
      if (nextMatch) {
        setPreloadedNextMatch(nextMatch);
        setIsNextMatchReady(true);
        prepareForNextMatch(nextMatch);
      } else {
        setPreloadedNextMatch(null);
        // Instead of silently doing nothing, show end of night
        setShowEndOfNightSummary(true);
      }
    } catch (error) {
      console.error('Error in preloading next match:', error);
      setPreloadedNextMatch(null);
      // On error, fall back to end of night rather than hanging
      setShowEndOfNightSummary(true);
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
