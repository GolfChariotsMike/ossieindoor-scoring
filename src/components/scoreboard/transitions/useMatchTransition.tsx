
import { useState, useEffect, useRef } from "react";
import { Fixture } from "@/types/volleyball";
import { toast } from "@/hooks/use-toast";
import { GameState } from "@/hooks/useGameState";
import { useNextMatch } from "../NextMatchLogic";

// Results display duration in seconds
export const RESULTS_DISPLAY_DURATION = 50;

interface UseMatchTransitionProps {
  courtId: string;
  fixture?: Fixture;
  gameState: GameState;
  match: any;
  nextMatches: Fixture[];
  refetchMatches: () => Promise<any>;
  setShowEndOfNightSummary: (show: boolean) => void;
}

export const useMatchTransition = ({
  courtId,
  fixture,
  gameState,
  match,
  nextMatches,
  refetchMatches,
  setShowEndOfNightSummary
}: UseMatchTransitionProps) => {
  const [resultsDisplayStartTime, setResultsDisplayStartTime] = useState<number | null>(null);
  const [preloadedNextMatch, setPreloadedNextMatch] = useState<Fixture | null>(null);
  
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTransitioningToResults = useRef<boolean>(false);
  const transitionErrorCount = useRef<number>(0);
  const hasTriedRefetchingMatches = useRef<boolean>(false);
  const isSearchingNextMatch = useRef<boolean>(false);
  
  const { findNextMatch, handleStartNextMatch } = useNextMatch(courtId, fixture);

  // Effect for when match is completed - start results display and preload next match
  useEffect(() => {
    if (gameState.isMatchComplete && match && gameState.hasGameStarted && !isTransitioningToResults.current) {
      console.log('Match complete, preparing for results screen');
      isTransitioningToResults.current = true;

      // Only save scores locally now, not to Supabase
      setTimeout(() => {
        gameState.saveScoresLocally(match.id, gameState.setScores.home, gameState.setScores.away)
          .catch(error => {
            console.error('Error saving match scores locally:', error);
            toast({
              title: "Local Storage Error",
              description: "Failed to save scores locally. Please take a screenshot of the scores.",
              variant: "destructive",
            });
          })
          .finally(() => {
            console.log('Starting results display timer');
            setResultsDisplayStartTime(Date.now());
            
            // Start searching for the next match immediately while showing results
            if (!isSearchingNextMatch.current) {
              preloadNextMatch();
            }
          });
      }, 100);
    }
  }, [gameState.isMatchComplete, match, gameState.hasGameStarted]);

  // Function to preload the next match
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

  // Timer effect for transitioning to next match after results display
  useEffect(() => {
    if (resultsDisplayStartTime) {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }

      console.log(`Setting up transition timeout for ${RESULTS_DISPLAY_DURATION} seconds at`, new Date().toISOString());
      
      transitionTimeoutRef.current = setTimeout(async () => {
        console.log('Transition timeout triggered at', new Date().toISOString());
        
        try {
          if (preloadedNextMatch) {
            console.log('Using preloaded next match:', preloadedNextMatch.Id);
            handleStartNextMatch(preloadedNextMatch);
          } else {
            console.log('No preloaded match, searching for next match now');
            
            // If we have no preloaded match, try the standard approach
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
              
              // After refetching, try to find the next match again
              const nextMatch = await findNextMatch(refetchResult.data || []);
              
              if (nextMatch) {
                console.log('Found next match after refetching:', nextMatch.Id);
                handleStartNextMatch(nextMatch);
              } else {
                console.log('No next match found after refetching, showing end of night summary');
                setShowEndOfNightSummary(true);
              }
              
              return; // Exit early as we've handled transition
            }
            
            // Try to find next match with current match data
            const nextMatch = await findNextMatch(nextMatches);
            
            if (nextMatch) {
              console.log('Found next match, transitioning to:', nextMatch.Id);
              handleStartNextMatch(nextMatch);
            } else {
              console.log('No next match found, showing end of night summary');
              // Log the court matches to help debug why no next match was found
              const courtMatches = nextMatches.filter(m => m.PlayingAreaName === `Court ${courtId}`);
              console.log(`Court ${courtId} matches:`, courtMatches.map(m => ({
                id: m.Id,
                dateTime: m.DateTime,
                teams: `${m.HomeTeam} vs ${m.AwayTeam}`
              })));
              
              setShowEndOfNightSummary(true);
            }
          }
        } catch (error) {
          console.error('Error in match transition:', error);
          transitionErrorCount.current += 1;
          
          // If we've had multiple transition errors, just go to summary
          if (transitionErrorCount.current >= 2) {
            console.log('Multiple transition errors, showing end of night summary');
            setShowEndOfNightSummary(true);
          } else {
            toast({
              title: "Transition Error",
              description: "There was a problem transitioning to the next match.",
              variant: "destructive",
            });
          }
        }
      }, RESULTS_DISPLAY_DURATION * 1000); // Convert seconds to milliseconds

      return () => {
        if (transitionTimeoutRef.current) {
          console.log('Cleaning up transition timeout');
          clearTimeout(transitionTimeoutRef.current);
        }
      };
    }
  }, [resultsDisplayStartTime, nextMatches, findNextMatch, handleStartNextMatch, courtId, refetchMatches, preloadedNextMatch]);

  // Return relevant state and functions for use in the main component
  return {
    resultsDisplayStartTime,
    preloadedNextMatch,
    setResultsDisplayStartTime
  };
};
