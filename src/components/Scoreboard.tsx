import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Fixture } from "@/types/volleyball";
import { Timer } from "./scoreboard/Timer";
import { BackButton } from "./scoreboard/BackButton";
import { ExitConfirmationDialog } from "./scoreboard/ExitConfirmationDialog";
import { GameScores } from "./scoreboard/GameScores";
import { LoadingSpinner } from "./scoreboard/LoadingSpinner";
import { useGameState } from "@/hooks/useGameState";
import { useMatchData } from "@/hooks/useMatchData";
import { useState, useEffect } from "react";

const Scoreboard = () => {
  const { courtId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fixture = location.state?.fixture as Fixture | undefined;
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

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
  } = useGameState();

  const { data: match, isLoading } = useMatchData(courtId!, fixture);

  useEffect(() => {
    if (isMatchComplete && match && hasGameStarted) {
      saveMatchScores(match.id, setScores.home, setScores.away);
    }
  }, [isMatchComplete, match, setScores, saveMatchScores, hasGameStarted]);

  const handleBack = () => {
    if (hasGameStarted) {
      setShowExitConfirmation(true);
    } else {
      navigateToCourtSelection();
    }
  };

  const navigateToCourtSelection = () => {
    // Get the date from the fixture if available, otherwise use current date
    const date = fixture 
      ? new Date(fixture.DateTime).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    
    navigate(`/court/${courtId}/${date}`, {
      replace: true // Use replace to prevent forward navigation when clicking back
    });
  };

  const confirmExit = () => {
    navigateToCourtSelection();
  };

  if (isLoading || !match) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-volleyball-red">
      <div className="max-w-[1920px] mx-auto relative h-screen p-6">
        <BackButton onClick={handleBack} />

        <div className="flex flex-col justify-between h-full">
          <Timer
            initialMinutes={1}
            onComplete={handleTimerComplete}
            onSwitchTeams={handleSwitchTeams}
            isBreak={isBreak}
            isMatchComplete={isMatchComplete}
          />

          <GameScores
            currentScore={currentScore}
            setScores={setScores}
            match={match}
            isTeamsSwitched={isTeamsSwitched}
            onScoreUpdate={handleScore}
          />
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

export default Scoreboard;