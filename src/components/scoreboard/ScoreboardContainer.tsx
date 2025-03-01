
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
  const [showResultsScreen, setShowResultsScreen] = useState(false);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousFixtureIdRef = useRef<string | null>(null);
  const isTransitioningToResults = useRef<boolean>(false);

  const gameState = useGameState();
  const { data: match, isLoading } = useMatchData(courtId!, fixture);
  const { findNextMatch, handleStartNextMatch } = useNextMatch(courtId!, fixture);

  const { data: nextMatches = [] } = useQuery({
    queryKey: ["matches", fixture?.DateTime ? format(parseFixtureDate(fixture.DateTime), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')],
    queryFn: async () => {
      const queryDate = fixture?.DateTime ? parseFixtureDate(fixture.DateTime) : new Date();
      const result = await fetchMatchData(undefined, queryDate);
      return (Array.isArray(result) ? result : []).map(item => ({
        ...item,
        Id: item.Id || item.id || `${item.DateTime}-${item.PlayingAreaName}`,
      })) as Fixture[];
    },
  });

  useEffect(() => {
    if (fixture?.Id && previousFixtureIdRef.current !== fixture.Id) {
      console.log('New fixture detected, resetting game state:', fixture.Id);
      gameState.resetGameState();
      previousFixtureIdRef.current = fixture.Id;
      isTransitioningToResults.current = false;
      setShowResultsScreen(false);
      setShowEndOfNightSummary(false);
    }
  }, [fixture?.Id, gameState]);

  // Handle match completion and prepare for results display
  useEffect(() => {
    if (gameState.isMatchComplete && match && gameState.hasGameStarted && !isTransitioningToResults.current) {
      console.log('Match complete, preparing for break3 before results screen');
      isTransitioningToResults.current = true;
    }
  }, [gameState.isMatchComplete, match, gameState.hasGameStarted]);

  // This function is called when the timer completed or a phase is skipped
  const handleTimerComplete = () => {
    console.log('Timer complete called with matchPhase from ScoreboardContainer');
    
    if (gameState.isMatchComplete && gameState.isBreak && !showResultsScreen) {
      console.log('Break3 completed, showing results screen now');
      setShowResultsScreen(true);
      
      // Save scores locally
      if (match) {
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
          });
      }
    } else {
      // Normal timer completion for non-final phases
      gameState.handleTimerComplete();
    }
  };

  // Handle the results display transition to next match
  useEffect(() => {
    if (resultsDisplayStartTime && showResultsScreen) {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }

      // Set a 60-second timeout (60000ms) for displaying results
      transitionTimeoutRef.current = setTimeout(() => {
        try {
          console.log('Results display timeout completed (60 seconds)');
          const nextMatch = findNextMatch(nextMatches);
          
          if (nextMatch) {
            console.log('Found next match, transitioning...');
            handleStartNextMatch(nextMatch);
          } else {
            console.log('No next match found, showing end of night summary');
            setShowEndOfNightSummary(true);
          }
        } catch (error) {
          console.error('Error in match transition:', error);
          setShowEndOfNightSummary(true);
        }
      }, 60000); // 60 seconds = 60000ms

      return () => {
        if (transitionTimeoutRef.current) {
          clearTimeout(transitionTimeoutRef.current);
        }
      };
    }
  }, [resultsDisplayStartTime, nextMatches, findNextMatch, handleStartNextMatch, showResultsScreen]);

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
    const nextMatch = findNextMatch(nextMatches);
    if (nextMatch) {
      handleStartNextMatch(nextMatch);
    } else {
      setShowEndOfNightSummary(true);
    }
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
      showExitConfirmation={showExitConfirmation}
      onExitConfirmationChange={setShowExitConfirmation}
      onConfirmExit={confirmExit}
      fixture={fixture}
      onTimerComplete={handleTimerComplete}
      showResultsScreen={showResultsScreen}
    />
  );
};
