
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
        
        gameState.saveScoresLocally(match.id, gameState.setScores.home, gameState.setScores.away, fixture)
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
    
    // Show a loading toast to indicate the next match is being prepared
    toast({
      title: "Next Match Ready",
      description: `${nextMatch.HomeTeam} vs ${nextMatch.AwayTeam} will start after the results timer`,
      duration: 5000,
    });
    
    // If less than 15 seconds left on the timer, start transition now
    const timeElapsed = Date.now() - (resultsDisplayStartTime || Date.now());
    const timeLeft = resultsDuration * 60 * 1000 - timeElapsed;
    
    if (timeLeft < 15000 && timeLeft > 0) {
      console.log(`Less than 15 seconds left (${Math.round(timeLeft/1000)}s), starting transition soon`);
      
      // Clear existing timeout and set a shorter one
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      
      // Allow 5 more seconds to view results
      transitionTimeoutRef.current = setTimeout(() => {
        console.log('Starting next match early due to ready state');
        handleStartNextMatch(nextMatch);
      }, 5000);
    }
  };

  useEffect(() => {
    if (resultsDisplayStartTime && !hasSetupTransitionTimer.current) {
      if (transitionTimeoutRef.current) {
        console.log('Cleaning up transition timeout');
        clearTimeout(transitionTimeoutRef.current);
      }

      console.log(`Setting up transition timeout for ${resultsDuration} minutes at`, new Date().toISOString());
      hasSetupTransitionTimer.current = true;
      
      transitionTimeoutRef.current = setTimeout(async () => {
        console.log('Transition timeout triggered at', new Date().toISOString());
        
        try {
          if (preloadedNextMatch) {
            console.log('Using preloaded next match:', preloadedNextMatch.Id);
            handleStartNextMatch(preloadedNextMatch);
          } else {
            console.log('No preloaded match, searching for next match now');
            
            if ((nextMatches.length === 0 || nextMatches.filter(m => m.PlayingAreaName === `Court ${courtId}`).length <= 1) 
                && !hasTriedRefetchingMatches.current) {
              
              console.log('Limited or no matches found, attempting to refetch matches data');
              hasTriedRefetchingMatches.current = true;
              
              const refetchResult = await refetchMatches();
              console.log('Refetched matches result:', {
                success: refetchResult.isSuccess,
                matchCount: refetchResult.data?.length || 0
              });
              
              const nextMatch = await findNextMatch(refetchResult.data || []);
              
              if (nextMatch) {
                console.log('Found next match after refetching:', nextMatch.Id);
                handleStartNextMatch(nextMatch);
              } else {
                console.log('No next match found after refetching, auto-saving and returning to court selection');
                handleEndOfNight();
              }
              
              return;
            }
            
            const nextMatch = await findNextMatch(nextMatches);
            
            if (nextMatch) {
              console.log('Found next match, transitioning to:', nextMatch.Id);
              handleStartNextMatch(nextMatch);
            } else {
              console.log('No next match found, auto-saving and returning to court selection');
              const courtMatches = nextMatches.filter(m => m.PlayingAreaName === `Court ${courtId}`);
              console.log(`Court ${courtId} matches:`, courtMatches.map(m => ({
                id: m.Id,
                dateTime: m.DateTime,
                teams: `${m.HomeTeam} vs ${m.AwayTeam}`
              })));
              
              handleEndOfNight();
            }
          }
        } catch (error) {
          console.error('Error in match transition:', error);
          transitionErrorCount.current += 1;
          
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
      }, resultsDuration * 60 * 1000);

      return () => {
        if (transitionTimeoutRef.current) {
          console.log('Cleaning up transition timeout');
          clearTimeout(transitionTimeoutRef.current);
        }
      };
    }
  }, [resultsDisplayStartTime]);

  return {
    resultsDisplayStartTime,
    preloadedNextMatch,
    isNextMatchReady,
    setResultsDisplayStartTime
  };
};
