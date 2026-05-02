import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Fixture, Score, SetScores } from "@/types/volleyball";
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
import { MatchPhase } from "./timer/types";

const parseFixtureDate = (dateStr: string) => {
  try {
    return parse(dateStr, 'dd/MM/yyyy HH:mm', new Date());
  } catch (error) {
    console.error('Error parsing date:', dateStr, error);
    return new Date();
  }
};

// ─── Crash recovery helpers ────────────────────────────────────────────────

interface CrashState {
  fixture: Fixture;
  setScores: SetScores;
  currentScore: Score;
  matchPhase: MatchPhase;
  timestamp: number;
  aceBlockStats?: {
    homeAces: number;
    awayAces: number;
    homeBlocks: number;
    awayBlocks: number;
  };
}

const CRASH_STATE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const CRASH_AUTO_RESTORE_MS = 10 * 60 * 1000;   // 10 minutes

const crashKey = (courtId: string) => `ossie_court_${courtId}_state`;

const saveCrashState = (courtId: string, state: CrashState) => {
  try {
    localStorage.setItem(crashKey(courtId), JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save crash state:', e);
  }
};

const loadCrashState = (courtId: string): CrashState | null => {
  try {
    const raw = localStorage.getItem(crashKey(courtId));
    if (!raw) return null;
    return JSON.parse(raw) as CrashState;
  } catch (e) {
    return null;
  }
};

const clearCrashState = (courtId: string) => {
  try {
    localStorage.removeItem(crashKey(courtId));
  } catch (e) {
    // ignore
  }
};

// ─── Component ────────────────────────────────────────────────────────────

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
  const crashRestoreAttemptedRef = useRef(false);

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
        console.log('Fetching ALL matches for date (no courtId filter):', format(queryDate, 'yyyy-MM-dd'));
        // Pass undefined for courtId — we need ALL fixtures to find the next match on this court
        const result = await fetchMatchData(undefined, queryDate);
        
        const fixtures = Array.isArray(result) ? result : [];
        console.log(`Found ${fixtures.length} total fixtures for date ${format(queryDate, 'yyyy-MM-dd')}`);
        
        return fixtures.map(item => ({
          ...item,
          Id: item.Id || item.id || `${item.DateTime}-${item.PlayingAreaName}`,
        })) as Fixture[];
      } catch (error) {
        console.error("Error loading next matches:", error);
        return [];
      }
    },
    retry: isOffline() ? false : 2,
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
    resultsDuration: settings.results_duration_minutes
  });

  useEffect(() => {
    if (isNextMatchReady && preloadedNextMatch) {
      // Already showing a toast in the useMatchTransition hook
    }
  }, [isNextMatchReady, preloadedNextMatch]);

  useEffect(() => {
    if (nextMatches.length > 0) {
      console.log('Available matches for transitions:', nextMatches.length);
      const courtMatches = nextMatches.filter(m => m.PlayingAreaName === `Court ${courtId}`);
      console.log(`Matches for Court ${courtId}:`, courtMatches.length);
      courtMatches.forEach((m, index) => {
        console.log(`  Match ${index + 1}: ${m.Id} - ${m.HomeTeam} vs ${m.AwayTeam} at ${m.DateTime}`);
      });
    }
  }, [nextMatches, courtId]);

  // ─── Crash recovery: restore on mount ─────────────────────────────────────
  useEffect(() => {
    if (!courtId || !fixture?.Id || crashRestoreAttemptedRef.current) return;
    crashRestoreAttemptedRef.current = true;

    const saved = loadCrashState(courtId);
    if (!saved) return;

    const ageMs = Date.now() - saved.timestamp;
    if (ageMs > CRASH_STATE_TTL_MS) {
      clearCrashState(courtId);
      return;
    }

    // Only restore if fixture IDs match
    if (saved.fixture?.Id !== fixture.Id) {
      clearCrashState(courtId);
      return;
    }

    const ageMinutes = Math.round(ageMs / 60000);
    // Restore scores in both cases (auto-restore for <10min, user-visible restore for 10min-2hr)
    console.log(`Restoring crash state for court ${courtId} (${ageMinutes} min old)`);
    gameState.setCurrentScore(saved.currentScore);
    gameState.setSetScores(saved.setScores);
    if (saved.aceBlockStats) {
      gameState.setAceBlockStats(saved.aceBlockStats);
    }

    if (ageMs <= CRASH_AUTO_RESTORE_MS) {
      // Silent auto-restore
      toast({
        title: "Match state restored",
        description: "Your previous scores have been automatically restored.",
        duration: 4000,
      });
    } else {
      // Visible notice for older state
      toast({
        title: "Scores restored",
        description: `Previous match scores from ${ageMinutes} minutes ago have been restored.`,
        duration: 6000,
      });
    }
  }, [courtId, fixture?.Id]);

  // ─── Crash recovery: save on score/phase changes ───────────────────────────
  useEffect(() => {
    if (!courtId || !fixture) return;

    const state: CrashState = {
      fixture,
      setScores: gameState.setScores,
      currentScore: gameState.currentScore,
      matchPhase: "not_started",
      timestamp: Date.now(),
      aceBlockStats: gameState.aceBlockStats,
    };
    saveCrashState(courtId, state);
  }, [courtId, gameState.currentScore, gameState.setScores, gameState.aceBlockStats, fixture]);

  // ─── Crash recovery: clear on complete or navigate away ───────────────────
  useEffect(() => {
    if (gameState.isMatchComplete && courtId) {
      clearCrashState(courtId);
    }
  }, [gameState.isMatchComplete, courtId]);

  // ─── Save scores after each break ends (when setScores grows) ─────────────
  const prevSetCountRef = useRef(0);
  useEffect(() => {
    const setCount = gameState.setScores.home.length;
    if (setCount > 0 && setCount > prevSetCountRef.current && match) {
      console.log(`Break ended — saving scores after set ${setCount}`);
      gameState.saveScoresLocally(match.id, gameState.setScores.home, gameState.setScores.away, fixture)
        .catch(err => console.error('Error saving mid-match scores:', err));
    }
    prevSetCountRef.current = setCount;
  }, [gameState.setScores.home.length]);

  useEffect(() => {
    return () => {
      // Clear when navigating away
      if (courtId) {
        clearCrashState(courtId);
      }
    };
  }, [courtId]);

  // ─── New fixture reset ─────────────────────────────────────────────────────
  useEffect(() => {
    if (fixture?.Id && previousFixtureIdRef.current !== fixture.Id) {
      console.log('New fixture detected, resetting game state:', fixture.Id);
      gameState.resetGameState();
      previousFixtureIdRef.current = fixture.Id;
      setShowEndOfNightSummary(false);
      crashRestoreAttemptedRef.current = false;
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
    if (courtId) clearCrashState(courtId);
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
      resultsDuration={settings.results_duration_minutes}
    />
  );
};
