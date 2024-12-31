import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Match, Fixture } from "@/types/volleyball";
import { useQuery } from "@tanstack/react-query";
import { fetchMatchData } from "@/utils/matchDataFetcher";
import { Timer } from "./scoreboard/Timer";
import { BackButton } from "./scoreboard/BackButton";
import { ExitConfirmationDialog } from "./scoreboard/ExitConfirmationDialog";
import { GameScores } from "./scoreboard/GameScores";
import { useGameState } from "@/hooks/useGameState";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  } = useGameState();

  const { data: match, isLoading } = useQuery({
    queryKey: ["match", courtId],
    queryFn: async () => {
      if (fixture) {
        // Create or update match in Supabase
        const { data: matchData, error } = await supabase
          .from('matches')
          .upsert({
            id: fixture.Id,
            court_number: parseInt(courtId!),
            start_time: fixture.DateTime,
            division: fixture.DivisionName,
            home_team_id: fixture.HomeTeamId,
            home_team_name: fixture.HomeTeam,
            away_team_id: fixture.AwayTeamId,
            away_team_name: fixture.AwayTeam,
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating match:', error);
          throw error;
        }

        return {
          id: fixture.Id,
          court: parseInt(courtId!),
          startTime: fixture.DateTime,
          division: fixture.DivisionName,
          homeTeam: { id: fixture.HomeTeamId, name: fixture.HomeTeam },
          awayTeam: { id: fixture.AwayTeamId, name: fixture.AwayTeam },
        };
      }

      const data = await fetchMatchData(courtId!);
      if (Array.isArray(data)) {
        throw new Error("Invalid match data received");
      }
      return data as Match;
    },
  });

  useEffect(() => {
    if (isMatchComplete && match) {
      saveMatchScores(match.id, setScores.home, setScores.away);
    }
  }, [isMatchComplete, match, setScores, saveMatchScores]);

  const handleBack = () => {
    setShowExitConfirmation(true);
  };

  const confirmExit = () => {
    navigate('/');
  };

  if (isLoading || !match) {
    return (
      <div className="min-h-screen bg-volleyball-red flex items-center justify-center">
        <div className="text-volleyball-cream text-2xl">Loading match data...</div>
      </div>
    );
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