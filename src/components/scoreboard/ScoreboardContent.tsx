import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Match, Fixture } from "@/types/volleyball";
import { Timer } from "./Timer";
import { BackButton } from "./BackButton";
import { ExitConfirmationDialog } from "./ExitConfirmationDialog";
import { GameScores } from "./GameScores";
import { ResultsScreen } from "./ResultsScreen";
import { Button } from "@/components/ui/button";
import { FastForward } from "lucide-react";
import { useNextMatch } from "./NextMatchLogic";
import { useQuery } from "@tanstack/react-query";
import { fetchMatchData } from "@/utils/matchDataFetcher";
import { format } from "date-fns";

interface ScoreboardContentProps {
  courtId: string;
  fixture?: Fixture;
  match: Match;
  gameState: any; // TODO: Add proper type
}

export const ScoreboardContent = ({
  courtId,
  fixture,
  match,
  gameState
}: ScoreboardContentProps) => {
  const navigate = useNavigate();
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [resultsDisplayStartTime, setResultsDisplayStartTime] = useState<number | null>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { findNextMatch, handleStartNextMatch } = useNextMatch(courtId, fixture);

  const { data: nextMatches = [] } = useQuery({
    queryKey: ["matches", fixture?.DateTime ? format(new Date(fixture.DateTime), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')],
    queryFn: async () => {
      const result = await fetchMatchData(undefined, fixture?.DateTime ? new Date(fixture.DateTime) : new Date());
      return (Array.isArray(result) ? result : []).map(item => ({
        ...item,
        Id: item.Id || item.id || `${item.DateTime}-${item.PlayingAreaName}`,
      })) as Fixture[];
    },
  });

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
        console.log('Results display time complete, checking for next match');
        const nextMatch = findNextMatch(nextMatches);
        if (nextMatch) {
          console.log('Auto-transitioning to next match:', nextMatch.Id);
          handleStartNextMatch(nextMatch);
        } else {
          console.log('No next match found for auto-transition');
          navigate('/');
        }
      }, 30000);

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
    <div className={`min-h-screen ${gameState.isMatchComplete ? 'bg-white' : 'bg-volleyball-red'}`}>
      <div className="max-w-[1920px] mx-auto relative h-screen p-6">
        <BackButton onClick={handleBack} />
        
        {gameState.isMatchComplete && (
          <div className="absolute top-6 right-6 z-10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90 border-volleyball-cream"
            >
              <FastForward className="w-4 h-4 mr-1" />
              Return to Courts
            </Button>
          </div>
        )}

        <div className="flex flex-col justify-between h-full">
          {gameState.isMatchComplete ? (
            <ResultsScreen
              match={match}
              setScores={gameState.setScores}
              isTeamsSwitched={gameState.isTeamsSwitched}
              onStartNextMatch={handleManualNextMatch}
            />
          ) : (
            <>
              <Timer
                initialMinutes={14}
                onComplete={gameState.handleTimerComplete}
                onSwitchTeams={gameState.handleSwitchTeams}
                isBreak={gameState.isBreak}
                isMatchComplete={gameState.isMatchComplete}
                fixture={fixture}
              />

              <GameScores
                currentScore={gameState.currentScore}
                setScores={gameState.setScores}
                match={match}
                isTeamsSwitched={gameState.isTeamsSwitched}
                onScoreUpdate={gameState.handleScore}
              />
            </>
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