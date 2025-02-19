import { Match, Fixture } from "@/types/volleyball";
import { Timer } from "./Timer";
import { BackButton } from "./BackButton";
import { ExitConfirmationDialog } from "./ExitConfirmationDialog";
import { GameScores } from "./GameScores";
import { LoadingSpinner } from "./LoadingSpinner";
import { ResultsScreen } from "./ResultsScreen";
import { Button } from "@/components/ui/button";
import { FastForward } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ScoreboardContentProps {
  match: Match | undefined;
  isLoading: boolean;
  gameState: any;
  onBack: () => void;
  onManualNextMatch: () => void;
  showExitConfirmation: boolean;
  onExitConfirmationChange: (show: boolean) => void;
  onConfirmExit: () => void;
  fixture?: Fixture;
  resultsDisplayStartTime?: number | null;
}

export const ScoreboardContent = ({
  match,
  isLoading,
  gameState,
  onBack,
  onManualNextMatch,
  showExitConfirmation,
  onExitConfirmationChange,
  onConfirmExit,
  fixture,
  resultsDisplayStartTime
}: ScoreboardContentProps) => {
  const navigate = useNavigate();

  if (isLoading || !match) {
    return <LoadingSpinner />;
  }

  return (
    <div className={`min-h-screen ${gameState.isMatchComplete ? 'bg-white' : 'bg-volleyball-red'}`}>
      <div className="max-w-[1920px] mx-auto relative h-screen p-6">
        <BackButton onClick={onBack} />
        
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
              onStartNextMatch={onManualNextMatch}
              resultsDisplayStartTime={resultsDisplayStartTime}
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
          onOpenChange={onExitConfirmationChange}
          onConfirm={onConfirmExit}
        />
      </div>
    </div>
  );
};
