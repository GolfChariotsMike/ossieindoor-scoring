import { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Score, SetScores, Match, Fixture } from "@/types/volleyball";
import { useQuery } from "@tanstack/react-query";
import { fetchMatchData } from "@/utils/matchDataFetcher";
import { Timer } from "./Timer";
import { useToast } from "@/components/ui/use-toast";
import { BackButton } from "./BackButton";
import { TeamScore } from "./TeamScore";
import { SetScoresDisplay } from "./SetScoresDisplay";
import { ExitConfirmationDialog } from "./ExitConfirmationDialog";

const Scoreboard = () => {
  const { courtId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fixture = location.state?.fixture as Fixture | undefined;
  const { toast } = useToast();

  const [currentScore, setCurrentScore] = useState<Score>({ home: 0, away: 0 });
  const [setScores, setSetScores] = useState<SetScores>({ home: [], away: [] });
  const [isBreak, setIsBreak] = useState(false);
  const [isTeamsSwitched, setIsTeamsSwitched] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

  const { data: match, isLoading } = useQuery<Match>({
    queryKey: ["match", courtId],
    queryFn: async () => {
      if (fixture) {
        return {
          id: fixture.Id || "match-1",
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

  const handleScore = (team: "home" | "away") => {
    setCurrentScore((prev) => ({
      ...prev,
      [team]: prev[team] + 1,
    }));
  };

  const handleTimerComplete = () => {
    if (isBreak) {
      setIsBreak(false);
      toast({
        title: "Break Time Over",
        description: "Starting next set",
      });
    } else {
      setIsBreak(true);
      toast({
        title: "Set Complete",
        description: "Starting 1 minute break",
      });
    }
  };

  const handleSwitchTeams = () => {
    setIsTeamsSwitched(!isTeamsSwitched);
    const newScore = {
      home: currentScore.away,
      away: currentScore.home
    };
    setCurrentScore(newScore);
    const newSetScores = {
      home: [...setScores.away],
      away: [...setScores.home]
    };
    setSetScores(newSetScores);
  };

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

  const homeTeam = isTeamsSwitched ? match.awayTeam : match.homeTeam;
  const awayTeam = isTeamsSwitched ? match.homeTeam : match.awayTeam;

  return (
    <div className="min-h-screen bg-volleyball-red">
      <div className="max-w-[1920px] mx-auto relative h-screen p-8">
        <BackButton onClick={handleBack} />

        <div className="flex flex-col justify-between h-full">
          <Timer
            initialMinutes={isBreak ? 1 : 14}
            onComplete={handleTimerComplete}
            onSwitchTeams={handleSwitchTeams}
          />

          <div className="grid grid-cols-[1fr_auto_1fr] gap-16 items-center mb-12">
            <TeamScore
              teamName={homeTeam.name}
              score={currentScore.home}
              onScoreUpdate={() => handleScore("home")}
            />

            <div className="w-64">
              <SetScoresDisplay 
                setScores={setScores} 
                match={match}
                isTeamsSwitched={isTeamsSwitched}
              />
            </div>

            <TeamScore
              teamName={awayTeam.name}
              score={currentScore.away}
              onScoreUpdate={() => handleScore("away")}
            />
          </div>
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