import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Fixture } from "@/types/volleyball";
import { BackButton } from "./BackButton";
import { ExitConfirmationDialog } from "./ExitConfirmationDialog";
import { LoadingSpinner } from "./LoadingSpinner";
import { ResultsScreen } from "./ResultsScreen";
import { GameContent } from "./GameContent";
import { useGameState } from "@/hooks/useGameState";
import { useMatchData } from "@/hooks/useMatchData";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FastForward } from "lucide-react";
import { useNextMatch } from "./NextMatchLogic";

const ScoreboardContainer = () => {
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

  const {
    currentScore,
    setScores,
    isBreak,
    isTeamsSwitched,
    isMatchComplete,
    handleScore,
    handleTimerComplete,
    handleSwitchTeams,
    saveMatchScores,
    hasGameStarted,
    resetGameState,
    startMatch
  } = useGameState();

  const { data: match, isLoading } = useMatchData(courtId!, fixture);
  const { findNextMatch, handleStartNextMatch } = useNextMatch(courtId!, fixture);

  // Reset game state only when fixture ID changes
  useEffect(() => {
    if (fixture?.Id && previousFixtureIdRef.current !== fixture.Id) {
      console.log('New fixture detected, resetting game state:', fixture.Id);
      resetGameState(fixture.Id);
      previousFixtureIdRef.current = fixture.Id;
      // Auto-start the timer for the first set
      startMatch(fixture.Id);
    }
  }, [fixture?.Id, resetGameState, startMatch]);

  useEffect(() => {
    if (isMatchComplete && match && hasGameStarted) {
      console.log('Match complete, saving scores');
      saveMatchScores(match.id, setScores.home, setScores.away);
      setResultsDisplayStartTime(Date.now());
    }
  }, [isMatchComplete, match, setScores, saveMatchScores, hasGameStarted]);

  useEffect(() => {
    if (resultsDisplayStartTime) {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }

      transitionTimeoutRef.current = setTimeout(() => {
        console.log('Results display time complete, checking for next match');
        const nextMatch = findNextMatch();
        handleStartNextMatch(nextMatch);
      }, 30000);

      return () => {
        if (transitionTimeoutRef.current) {
          clearTimeout(transitionTimeoutRef.current);
        }
      };
    }
  }, [resultsDisplayStartTime, findNextMatch, handleStartNextMatch]);

  const handleBack = () => {
    if (hasGameStarted) {
      setShowExitConfirmation(true);
    } else {
      navigate('/');
    }
  };

  const confirmExit = () => {
    navigate('/');
  };

  if (isLoading || !match) {
    return <LoadingSpinner />;
  }

  return (
    <div className={`min-h-screen ${isMatchComplete ? 'bg-white' : 'bg-volleyball-red'}`}>
      <div className="max-w-[1920px] mx-auto relative h-screen p-6">
        <BackButton onClick={handleBack} />
        
        {isMatchComplete && (
          <div className="absolute top-6 right-6 z-10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const nextMatch = findNextMatch();
                handleStartNextMatch(nextMatch);
              }}
              className="bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90 border-volleyball-cream"
            >
              <FastForward className="w-4 h-4 mr-1" />
              Next Match
            </Button>
          </div>
        )}

        <div className="flex flex-col justify-between h-full">
          {isMatchComplete ? (
            <ResultsScreen
              match={match}
              setScores={setScores}
              isTeamsSwitched={isTeamsSwitched}
            />
          ) : (
            <GameContent
              isBreak={isBreak}
              currentScore={currentScore}
              setScores={setScores}
              match={match}
              isTeamsSwitched={isTeamsSwitched}
              onTimerComplete={handleTimerComplete}
              onSwitchTeams={handleSwitchTeams}
              onScoreUpdate={handleScore}
              isMatchComplete={isMatchComplete}
            />
          )}
        </div>

        <ExitConfirmationDialog
          open={showExitConfirmation}
          onOpenChange={setShowExitConfirmation}
          onConfirm={confirmExit}
        />
      </div>
    </div>
  );
};

export default ScoreboardContainer;