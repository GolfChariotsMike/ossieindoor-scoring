import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Fixture } from "@/types/volleyball";
import { Timer } from "./scoreboard/Timer";
import { BackButton } from "./scoreboard/BackButton";
import { ExitConfirmationDialog } from "./scoreboard/ExitConfirmationDialog";
import { GameScores } from "./scoreboard/GameScores";
import { LoadingSpinner } from "./scoreboard/LoadingSpinner";
import { ResultsScreen } from "./scoreboard/ResultsScreen";
import { useGameState } from "@/hooks/useGameState";
import { useMatchData } from "@/hooks/useMatchData";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMatchData } from "@/utils/matchDataFetcher";
import { format } from "date-fns";

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

  // Query to get next match
  const { data: nextMatches = [] } = useQuery({
    queryKey: ["matches", format(new Date(), 'yyyy-MM-dd')],
    queryFn: async () => {
      const result = await fetchMatchData(undefined, new Date());
      // Ensure we always return an array
      return Array.isArray(result) ? result : [];
    },
  });

  const findNextMatch = () => {
    if (!fixture || nextMatches.length === 0) return null;
    
    const currentMatchIndex = nextMatches.findIndex(
      (m: Fixture) => m.Id === fixture.Id
    );
    
    if (currentMatchIndex === -1) return null;
    
    const nextMatch = nextMatches
      .slice(currentMatchIndex + 1)
      .find((m: Fixture) => m.PlayingAreaName === `Court ${courtId}`);
    
    return nextMatch;
  };

  useEffect(() => {
    if (isMatchComplete && match && hasGameStarted) {
      saveMatchScores(match.id, setScores.home, setScores.away);
      
      // After 30 seconds, navigate to next match if available
      const timer = setTimeout(() => {
        const nextMatch = findNextMatch();
        if (nextMatch) {
          navigate(`/scoreboard/${courtId}`, {
            state: { fixture: nextMatch },
            replace: true
          });
        }
      }, 30000); // 30 seconds

      return () => clearTimeout(timer);
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
    const date = fixture 
      ? new Date(fixture.DateTime).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    
    navigate(`/court/${courtId}/${date}`, {
      replace: true
    });
  };

  const confirmExit = () => {
    navigateToCourtSelection();
  };

  if (isLoading || !match) {
    return <LoadingSpinner />;
  }

  return (
    <div className={`min-h-screen ${isMatchComplete ? 'bg-white' : 'bg-volleyball-red'}`}>
      <div className="max-w-[1920px] mx-auto relative h-screen p-6">
        <BackButton onClick={handleBack} />

        <div className="flex flex-col justify-between h-full">
          {isMatchComplete ? (
            <ResultsScreen
              match={match}
              setScores={setScores}
              isTeamsSwitched={isTeamsSwitched}
            />
          ) : (
            <>
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

export default Scoreboard;