
import { Match, Fixture } from "@/types/volleyball";
import { BackButton } from "./BackButton";
import { LoadingSpinner } from "./LoadingSpinner";
import { ResultsScreen } from "./ResultsScreen";
import { ScoreboardControls } from "./ScoreboardControls";
import { ScoreboardLayout } from "./ScoreboardLayout";
import { ExitConfirmationDialog } from "./ExitConfirmationDialog";
import { useGameState } from "@/hooks/useGameState";

interface ScoreboardContentProps {
  match: Match | null;
  isLoading: boolean;
  gameState: ReturnType<typeof useGameState>;
  onBack: () => void;
  onManualNextMatch?: () => void;
  onEndOfNight?: () => void;
  showExitConfirmation: boolean;
  onExitConfirmationChange: (show: boolean) => void;
  onConfirmExit: () => void;
  fixture?: Fixture;
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
  fixture
}: ScoreboardContentProps) => {
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!match) {
    return (
      <div className="flex items-center justify-center h-screen bg-volleyball-red">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md text-center">
          <h2 className="text-xl font-bold mb-4">No Match Found</h2>
          <p className="mb-6">Unable to load match information.</p>
          <button 
            onClick={onBack} 
            className="bg-volleyball-black text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  // Display results screen after match completion
  if (gameState.isMatchComplete && !gameState.finalBreakActive) {
    return (
      <ResultsScreen
        match={match}
        setScores={gameState.setScores}
        onManualNextMatch={onManualNextMatch}
        onEndOfNight={onEndOfNight}
      />
    );
  }

  const formattedMatch = {
    ...match,
    PlayingAreaName: `Court ${match.court}`,
    DateTime: match.startTime,
    HomeTeam: match.homeTeam.name,
    AwayTeam: match.awayTeam.name,
    HomeTeamId: match.homeTeam.id,
    AwayTeamId: match.awayTeam.id,
    Id: match.id
  };

  return (
    <div className="min-h-screen bg-volleyball-red">
      <div className="max-w-[1920px] mx-auto relative h-screen p-6">
        <BackButton onClick={onBack} />

        <ScoreboardLayout
          isBreak={gameState.isBreak}
          currentScore={gameState.currentScore}
          setScores={gameState.setScores}
          match={match}
          isTeamsSwitched={gameState.isTeamsSwitched}
          isMatchComplete={gameState.isMatchComplete}
          onTimerComplete={() => gameState.handleTimerComplete(match.id, match)}
          onSwitchTeams={gameState.handleSwitchTeams}
          onScoreUpdate={gameState.handleScoreUpdate}
        />

        <ScoreboardControls
          isBreak={gameState.isBreak}
          isMatchComplete={gameState.isMatchComplete}
          fixture={fixture}
        />

        <ExitConfirmationDialog
          open={showExitConfirmation}
          onOpenChange={onExitConfirmationChange}
          onConfirm={onConfirmExit}
        />
      </div>
    </div>
  );
};
