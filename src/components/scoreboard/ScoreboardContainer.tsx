
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
import { toast } from "@/components/ui/use-toast";

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
  
  // Get fixture from navigation state
  const fixture = location.state?.fixture as Fixture | undefined;

  console.log('ScoreboardContainer - Initial fixture data:', { 
    fromState: fixture,
    locationState: location.state
  });

  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [resultsDisplayStartTime, setResultsDisplayStartTime] = useState<number | null>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousFixtureIdRef = useRef<string | null>(null);
  const hasTriedSavingScores = useRef<boolean>(false);
  const isTransitioningToResults = useRef<boolean>(false);

  const gameState = useGameState();
  const { data: match, isLoading } = useMatchData(courtId!, fixture);

  // Redirect if no fixture is found
  useEffect(() => {
    if (!fixture && !isLoading) {
      console.log('No fixture found, redirecting to court selection');
      toast({
        title: "No fixture found",
        description: "Returning to court selection.",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [fixture, navigate, isLoading]);

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

  // Reset game state when fixture changes
  useEffect(() => {
    if (fixture?.Id && previousFixtureIdRef.current !== fixture.Id) {
      console.log('New fixture detected, resetting game state:', fixture.Id);
      gameState.resetGameState();
      previousFixtureIdRef.current = fixture.Id;
      hasTriedSavingScores.current = false;
      isTransitioningToResults.current = false;
    }
  }, [fixture?.Id, gameState.resetGameState]);

  // Handle match completion
  useEffect(() => {
    if (gameState.isMatchComplete && match && gameState.hasGameStarted && !hasTriedSavingScores.current && !isTransitioningToResults.current) {
      console.log('Match complete, attempting to save scores');
      isTransitioningToResults.current = true;
      hasTriedSavingScores.current = true;

      setTimeout(() => {
        gameState.saveMatchScores(match.id, gameState.setScores.home, gameState.setScores.away)
          .catch(error => {
            console.error('Error saving match scores:', error);
            toast({
              title: "Connection Issues",
              description: "Scores saved locally and will be uploaded when connection is restored.",
              variant: "default",
            });
          })
          .finally(() => {
            console.log('Starting results display timer');
            setResultsDisplayStartTime(Date.now());
          });
      }, 100);
    }
  }, [gameState.isMatchComplete, match, gameState.setScores, gameState.saveMatchScores, gameState.hasGameStarted]);

  // Handle transition to next match
  useEffect(() => {
    if (resultsDisplayStartTime) {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }

      transitionTimeoutRef.current = setTimeout(() => {
        try {
          console.log('Results display time complete, checking for next match');
          const nextMatch = findNextMatch(nextMatches);
          
          if (nextMatch) {
            console.log('Found next match, transitioning:', nextMatch.Id);
            handleStartNextMatch(nextMatch);
          } else {
            console.log('No next match found, returning to court selection');
            navigate('/');
          }
        } catch (error) {
          console.error('Error in match transition:', error);
          toast({
            title: "Error",
            description: "Something went wrong. Returning to court selection.",
            variant: "destructive",
          });
          navigate('/');
        }
      }, 50000);

      return () => {
        if (transitionTimeoutRef.current) {
          clearTimeout(transitionTimeoutRef.current);
        }
      };
    }
  }, [resultsDisplayStartTime, nextMatches, findNextMatch, handleStartNextMatch, navigate]);

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
    console.log('Manual next match transition triggered');
    const nextMatch = findNextMatch(nextMatches);
    if (nextMatch) {
      console.log('Manually transitioning to next match:', nextMatch.Id);
      handleStartNextMatch(nextMatch);
    } else {
      console.log('No next match found, returning to court selection');
      navigate('/');
    }
  };

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
    />
  );
};
