import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Fixture } from "@/types/volleyball";
import { BackButton } from "./scoreboard/BackButton";
import { ExitConfirmationDialog } from "./scoreboard/ExitConfirmationDialog";
import { LoadingSpinner } from "./scoreboard/LoadingSpinner";
import { ResultsScreen } from "./scoreboard/ResultsScreen";
import { ScoreboardLayout } from "./scoreboard/ScoreboardLayout";
import { useGameState } from "@/hooks/useGameState";
import { useMatchData } from "@/hooks/useMatchData";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMatchData } from "@/utils/matchDataFetcher";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { FastForward } from "lucide-react";
import { useNextMatch } from "./scoreboard/NextMatchLogic";
import { toast } from "@/components/ui/use-toast";

const Scoreboard = () => {
  const { courtId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fixture = location.state?.fixture as Fixture | undefined;

  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [stats, setStats] = useState({
    home: { blocks: 0, aces: 0 },
    away: { blocks: 0, aces: 0 }
  });

  const {
    currentScore,
    setScores,
    isBreak,
    isTeamsSwitched,
    isMatchComplete,
    handleScore,
    handleTimerComplete,
    handleSwitchTeams,
    hasGameStarted,
    resetGameState
  } = useGameState();

  const { data: match, isLoading } = useMatchData(courtId!, fixture);
  const { findNextMatch, handleStartNextMatch } = useNextMatch(courtId!, fixture);

  const handleRecordStat = (team: 'home' | 'away', type: 'block' | 'ace') => {
    setStats(prev => ({
      ...prev,
      [team]: {
        ...prev[team],
        [type]: prev[team][type] + 1
      }
    }));

    toast({
      title: `${type.toUpperCase()} recorded`,
      description: `${type === 'block' ? 'Block' : 'ACE'} recorded for ${team === 'home' ? 'Home' : 'Away'} team`,
    });
  };

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
              onClick={() => navigate('/')}
              className="bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90 border-volleyball-cream"
            >
              <FastForward className="w-4 h-4 mr-1" />
              Return to Courts
            </Button>
          </div>
        )}

        <div className="flex flex-col justify-between h-full">
          {isMatchComplete ? (
            <ResultsScreen
              match={match}
              setScores={setScores}
              stats={stats}
              isTeamsSwitched={isTeamsSwitched}
              onStartNextMatch={() => {
                const nextMatch = findNextMatch();
                if (nextMatch) {
                  handleStartNextMatch(nextMatch);
                }
              }}
            />
          ) : (
            <ScoreboardLayout
              isBreak={isBreak}
              currentScore={currentScore}
              setScores={setScores}
              match={match}
              isTeamsSwitched={isTeamsSwitched}
              isMatchComplete={isMatchComplete}
              onTimerComplete={handleTimerComplete}
              onSwitchTeams={handleSwitchTeams}
              onScoreUpdate={handleScore}
              onRecordStat={handleRecordStat}
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

export default Scoreboard;