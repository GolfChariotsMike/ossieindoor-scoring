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
        // Generate a UUID for the match
        const matchId = crypto.randomUUID();
        
        // Create or update match in Supabase
        const { data: matchData, error } = await supabase
          .from('matches')
          .upsert({
            id: matchId,
            court_number: parseInt(courtId!),
            start_time: fixture.DateTime,
            division: fixture.DivisionName,
            home_team_id: fixture.HomeTeamId || 'unknown',
            home_team_name: fixture.HomeTeam,
            away_team_id: fixture.AwayTeamId || 'unknown',
            away_team_name: fixture.AwayTeam,
          })
          .select()
          .maybeSingle();

        if (error) {
          console.error('Error creating match:', error);
          throw error;
        }

        return {
          id: matchId,
          court: parseInt(courtId!),
          startTime: fixture.DateTime,
          division: fixture.DivisionName,
          homeTeam: { id: fixture.HomeTeamId || 'unknown', name: fixture.HomeTeam },
          awayTeam: { id: fixture.AwayTeamId || 'unknown', name: fixture.AwayTeam },
        };
      }

      // If no fixture provided, try to find an existing match for this court
      const { data: existingMatch, error } = await supabase
        .from('matches')
        .select()
        .eq('court_number', parseInt(courtId!))
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (error) {
        console.error('Error fetching match:', error);
        throw error;
      }

      if (!existingMatch) {
        throw new Error("No match found for this court");
      }

      return {
        id: existingMatch.id,
        court: existingMatch.court_number,
        startTime: existingMatch.start_time,
        division: existingMatch.division,
        homeTeam: { id: existingMatch.home_team_id, name: existingMatch.home_team_name },
        awayTeam: { id: existingMatch.away_team_id, name: existingMatch.away_team_name },
      };
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