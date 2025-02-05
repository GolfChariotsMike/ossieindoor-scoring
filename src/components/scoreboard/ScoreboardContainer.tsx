
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
  const searchParams = new URLSearchParams(location.search);
  const fixtureParam = searchParams.get('fixture');
  
  const fixture = fixtureParam 
    ? JSON.parse(decodeURIComponent(fixtureParam)) as Fixture 
    : location.state?.fixture as Fixture | undefined;

  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [resultsDisplayStartTime, setResultsDisplayStartTime] = useState<number | null>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousFixtureIdRef = useRef<string | null>(null);

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
    }
  }, [fixture?.Id, gameState.resetGameState]);

  useEffect(() => {
    if (gameState.isMatchComplete && match && gameState.hasGameStarted) {
      console.log('Match complete, saving scores');
      gameState.saveMatchScores(match.id, gameState.setScores.home, gameState.setScores.away);
      setResultsDisplayStartTime(Date.now());
    }
  }, [gameState.isMatchComplete, match, gameState.setScores, gameState.saveMatchScores, gameState.hasGameStarted]);

  useEffect(() => {
    if (resultsDisplayStartTime) {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }

      transitionTimeoutRef.current = setTimeout(() => {
        try {
          console.log('Results display time complete, checking for next match', {
            currentFixture: fixture?.Id,
            currentTime: new Date().toISOString(),
            availableMatches: nextMatches.length
          });

          const nextMatch = findNextMatch(nextMatches);
          
          if (nextMatch) {
            console.log('Found next match:', {
              nextMatchId: nextMatch.Id,
              nextMatchTime: nextMatch.DateTime,
              nextMatchTeams: `${nextMatch.HomeTeam} vs ${nextMatch.AwayTeam}`
            });
            
            try {
              handleStartNextMatch(nextMatch);
            } catch (error) {
              console.error('Error transitioning to next match:', {
                error,
                nextMatchDetails: nextMatch,
                currentFixture: fixture
              });
              
              toast({
                title: "Error transitioning to next match",
                description: "There was an error loading the next match. Returning to court selection.",
                variant: "destructive",
              });
              
              setTimeout(() => {
                navigate('/');
              }, 3000);
            }
          } else {
            console.log('No next match found', {
              currentTime: new Date().toISOString(),
              availableMatches: nextMatches.map(m => ({
                id: m.Id,
                datetime: m.DateTime,
                court: m.PlayingAreaName
              }))
            });
            navigate('/');
          }
        } catch (error) {
          console.error('Critical error in match transition logic:', {
            error,
            currentFixture: fixture,
            nextMatchesCount: nextMatches.length,
            resultsDisplayStartTime
          });
          
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
  }, [resultsDisplayStartTime, nextMatches, findNextMatch, handleStartNextMatch, navigate, fixture]);

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

  // Pass fixture along with match to ensure all match data is available
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
