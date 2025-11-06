
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
import { useTimerSettings } from "@/hooks/useTimerSettings";

interface ScoreboardContentProps {
  match: Match | undefined;
  isLoading: boolean;
  gameState: any; // Using any here as the gameState type is complex and internal
  onBack: () => void;
  onManualNextMatch: () => void;
  onEndOfNight?: () => void;
  showExitConfirmation: boolean;
  onExitConfirmationChange: (show: boolean) => void;
  onConfirmExit: () => void;
  fixture?: Fixture;
  nextMatchReady?: boolean;
}

export const ScoreboardContent = ({
  match,
  isLoading,
  gameState,
  onBack,
  onManualNextMatch,
  onEndOfNight,
  showExitConfirmation,
  onExitConfirmationChange,
  onConfirmExit,
  fixture,
  nextMatchReady = false
}: ScoreboardContentProps) => {
  const navigate = useNavigate();
  const { settings, isLoading: isLoadingSettings } = useTimerSettings();

  if (isLoading || isLoadingSettings || !match) {
    return <LoadingSpinner />;
  }

  return (
    <div className={`min-h-screen ${gameState.isMatchComplete ? 'bg-white' : 'bg-volleyball-red'}`}>
      <div className="max-w-[1920px] mx-auto relative h-screen p-6">
        <BackButton onClick={onBack} />
        
        {gameState.isMatchComplete && (
          <div className="absolute top-6 right-6 z-10 flex gap-2">
            {nextMatchReady && (
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium border border-green-300 animate-pulse">
                Next Match Ready
              </div>
            )}
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
              onEndOfNight={onEndOfNight}
              nextMatchReady={nextMatchReady}
            />
          ) : (
            <>
              <Timer
                initialMinutes={settings.set_duration_minutes}
                breakDurationSeconds={settings.break_duration_seconds}
                onComplete={gameState.handleTimerComplete}
                onSwitchTeams={gameState.handleSwitchTeams}
                isBreak={gameState.isBreak}
                isMatchComplete={gameState.isMatchComplete}
                fixture={fixture}
                onAceBlock={gameState.handleAceBlock}
                isTeamsSwitched={gameState.isTeamsSwitched}
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
