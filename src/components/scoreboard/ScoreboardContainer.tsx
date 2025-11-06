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
import { useMatchTransition } from "./transitions/useMatchTransition";
import { useTimerSettings } from "@/hooks/useTimerSettings";

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
  const [showEndOfNightSummary, setShowEndOfNightSummary] = useState(false);
  
  const previousFixtureIdRef = useRef<string | null>(null);

  const gameState = useGameState();
  const { data: match, isLoading, error } = useMatchData(courtId!, fixture);
  const { findNextMatch, handleStartNextMatch } = useNextMatch(courtId!, fixture);
  const { settings } = useTimerSettings();

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
        
        // Log the number of matches found for debugging
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
    // Prevent retries in offline mode
    retry: isOffline() ? false : 2,
    // Increase stale time to reduce unnecessary refetches
    staleTime: 60000,
  });

  // Use our custom hook for match transition logic
  const { 
    resultsDisplayStartTime,
    preloadedNextMatch,
    isNextMatchReady 
  } = useMatchTransition({
    courtId: courtId!,
    fixture,
    gameState,
    match,
    nextMatches,
    refetchMatches,
    setShowEndOfNightSummary,
    resultsDuration: settings.results_duration_seconds
  });

  // Add a visual indicator when a next match is ready
  useEffect(() => {
    if (isNextMatchReady && preloadedNextMatch) {
      // Already showing a toast in the useMatchTransition hook
    }
  }, [isNextMatchReady, preloadedNextMatch]);

  useEffect(() => {
    // Log the fixtures we've loaded to help debug matching issues
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
      setShowEndOfNightSummary(false);
    }
  }, [fixture?.Id, gameState.resetGameState]);

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

  const handleManualNextMatch = async () => {
    try {
      const nextMatch = await findNextMatch(nextMatches);
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
      nextMatchReady={isNextMatchReady && preloadedNextMatch ? true : false}
      resultsDuration={settings.results_duration_seconds}
    />
  );
};
