
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Fixture } from "@/types/volleyball";
import { useGameState } from "@/hooks/useGameState";
import { useMatchData } from "@/hooks/useMatchData";
import { ScoreboardContent } from "./ScoreboardContent";
import { ExitConfirmationDialog } from "./ExitConfirmationDialog";
import { useState, useEffect, useRef } from "react";
import { useNextMatch } from "./NextMatchLogic";
import { useQuery } from "@tanstack/react-query";
import { fetchMatchData } from "@/utils/matchDataFetcher";
import { format, parse } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { EndOfNightSummary } from "./EndOfNightSummary";
import { isOffline } from "@/utils/offlineMode";

const parseFixtureDate = (dateStr: string) => {
  try {
    return parse(dateStr, 'dd/MM/yyyy HH:mm', new Date());
  } catch (error) {
    console.error('Error parsing date:', dateStr, error);
    return new Date();
  }
};

export const ScoreboardContainer = () => {
  const { courtId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const fixtureParam = searchParams.get('fixture');
  
  const fixture = fixtureParam 
    ? JSON.parse(decodeURIComponent(fixtureParam)) as Fixture 
    : location.state?.fixture as Fixture | undefined;

  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [resultsDisplayStartTime, setResultsDisplayStartTime] = useState<number | null>(null);
  const [showEndOfNightSummary, setShowEndOfNightSummary] = useState(false);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousFixtureIdRef = useRef<string | null>(null);
  const isTransitioningToResults = useRef<boolean>(false);
  const transitionErrorCount = useRef<number>(0);
  const hasTriedRefetchingMatches = useRef<boolean>(false);

  const RESULTS_DISPLAY_DURATION = 50;

  const gameState = useGameState();
  const { data: match, isLoading, error } = useMatchData(courtId!, fixture);
  const { findNextMatch, handleStartNextMatch } = useNextMatch(courtId!, fixture);

  const queryDate = fixture?.DateTime 
    ? format(parseFixtureDate(fixture.DateTime), 'yyyy-MM-dd') 
    : format(new Date(), 'yyyy-MM-dd');

  const { 
    data: nextMatches = [], 
    isLoading: isLoadingMatches, 
    error: matchesError,
    refetch: refetchMatches 
  } = useQuery({
    queryKey: ["matches", queryDate],
    queryFn: async () => {
      try {
        const queryDate = fixture?.DateTime ? parseFixtureDate(fixture.DateTime) : new Date();
        console.log('Fetching matches for date:', format(queryDate, 'yyyy-MM-dd'));
        const result = await fetchMatchData(undefined, queryDate);
        
        console.log(`Found ${Array.isArray(result) ? result.length : 0} matches for date ${format(queryDate, 'yyyy-MM-dd')}`);
        
        return (Array.isArray(result) ? result : []).map(item => ({
          ...item,
          Id: item.Id || item.id || `${item.DateTime}-${item.PlayingAreaName}`,
        })) as Fixture[];
      } catch (error) {
        console.error("Error loading next matches:", error);
        return []; // Return empty array as fallback
      }
    },
    retry: isOffline() ? false : 2,
    staleTime: 60000,
  });

  useEffect(() => {
    if (nextMatches.length > 0) {
      console.log('Available matches for transitions:', nextMatches.length);
      const courtMatches = nextMatches.filter(m => m.PlayingAreaName === `Court ${courtId}`);
      console.log(`Matches for Court ${courtId}:`, courtMatches.length);
      courtMatches.forEach((match, index) => {
        console.log(`  Match ${index + 1}: ${match.Id} - ${match.HomeTeam} vs ${match.AwayTeam} at ${match.DateTime}`);
      });
    }
  }, [nextMatches, courtId]);

  useEffect(() => {
    if (fixture?.Id && previousFixtureIdRef.current !== fixture.Id) {
      console.log('New fixture detected, resetting game state:', fixture.Id);
      gameState.resetGameState();
      previousFixtureIdRef.current = fixture.Id;
      isTransitioningToResults.current = false;
      setShowEndOfNightSummary(false);
      transitionErrorCount.current = 0;
      hasTriedRefetchingMatches.current = false;
    }
  }, [fixture?.Id, gameState.resetGameState]);

  useEffect(() => {
    if (gameState.isMatchComplete && match && gameState.hasGameStarted && !isTransitioningToResults.current) {
      console.log('Match complete, preparing for results screen');
      isTransitioningToResults.current = true;

      setTimeout(() => {
        gameState.saveScoresLocally(match.id, gameState.setScores.home, gameState.setScores.away, match)
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
          });
      }, 100);
    }
  }, [gameState.isMatchComplete, match, gameState.setScores, gameState.hasGameStarted]);

  useEffect(() => {
    if (resultsDisplayStartTime) {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }

      console.log(`Setting up transition timeout for ${RESULTS_DISPLAY_DURATION} seconds at`, new Date().toISOString());
      
      transitionTimeoutRef.current = setTimeout(() => {
        console.log('Transition timeout triggered at', new Date().toISOString());
        
        try {
          // If we're in offline mode, be more cautious with transitions
          if (isOffline()) {
            console.log('In offline mode, showing end of night summary instead of attempting match transition');
            setShowEndOfNightSummary(true);
            return;
          }
          
          if ((nextMatches.length === 0 || nextMatches.filter(m => m.PlayingAreaName === `Court ${courtId}`).length <= 1) 
              && !hasTriedRefetchingMatches.current) {
            
            console.log('Limited or no matches found, attempting to refetch matches data');
            hasTriedRefetchingMatches.current = true;
            
            refetchMatches().then(result => {
              console.log('Refetched matches result:', {
                success: result.isSuccess,
                matchCount: result.data?.length || 0
              });
              
              const nextMatch = findNextMatch(result.data || []);
              
              if (nextMatch) {
                console.log('Found next match after refetching:', nextMatch.Id);
                handleStartNextMatch(nextMatch);
              } else {
                console.log('No next match found after refetching, showing end of night summary');
                setShowEndOfNightSummary(true);
              }
            }).catch(error => {
              console.error('Error refetching matches:', error);
              setShowEndOfNightSummary(true);
            });
            
            return;
          }
          
          const nextMatch = findNextMatch(nextMatches);
          
          if (nextMatch) {
            console.log('Found next match, transitioning to:', nextMatch.Id);
            handleStartNextMatch(nextMatch);
          } else {
            console.log('No next match found, showing end of night summary');
            const courtMatches = nextMatches.filter(m => m.PlayingAreaName === `Court ${courtId}`);
            console.log(`Court ${courtId} matches:`, courtMatches.map(m => ({
              id: m.Id,
              dateTime: m.DateTime,
              teams: `${m.HomeTeam} vs ${m.AwayTeam}`
            })));
            
            setShowEndOfNightSummary(true);
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
      }, RESULTS_DISPLAY_DURATION * 1000);

      return () => {
        if (transitionTimeoutRef.current) {
          console.log('Cleaning up transition timeout');
          clearTimeout(transitionTimeoutRef.current);
        }
      };
    }
  }, [resultsDisplayStartTime, nextMatches, findNextMatch, handleStartNextMatch, courtId, refetchMatches]);

  const handleBack = () => {
    if (gameState.hasGameStarted) {
      setShowExitConfirmation(true);
    } else {
      navigate('/');
    }
  };

  const confirmExit = () => {
    navigate('/');
  };

  const handleManualNextMatch = () => {
    try {
      if (isOffline()) {
        toast({
          title: "Offline Mode",
          description: "Manual match navigation is limited in offline mode.",
          variant: "default",
        });
        setShowEndOfNightSummary(true);
        return;
      }
      
      const nextMatch = findNextMatch(nextMatches);
      if (nextMatch) {
        handleStartNextMatch(nextMatch);
      } else {
        setShowEndOfNightSummary(true);
      }
    } catch (error) {
      console.error('Error in manual next match:', error);
      toast({
        title: "Navigation Error",
        description: "There was a problem finding the next match. Going to summary instead.",
        variant: "destructive",
      });
      setShowEndOfNightSummary(true);
    }
  };

  const handleEndOfNight = () => {
    setShowEndOfNightSummary(true);
  };

  if (showEndOfNightSummary) {
    return (
      <EndOfNightSummary 
        courtId={courtId!}
        onBack={() => setShowEndOfNightSummary(false)}
      />
    );
  }

  return (
    <ScoreboardContent
      match={match}
      isLoading={isLoading}
      gameState={gameState}
      onBack={handleBack}
      onManualNextMatch={handleManualNextMatch}
      onEndOfNight={handleEndOfNight}
      showExitConfirmation={showExitConfirmation}
      onExitConfirmationChange={setShowExitConfirmation}
      onConfirmExit={confirmExit}
      fixture={fixture}
    />
  );
};
