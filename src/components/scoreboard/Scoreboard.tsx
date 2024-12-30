import { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Score, SetScores, Match, Fixture } from "@/types/volleyball";
import { useQuery } from "@tanstack/react-query";
import { fetchMatchData } from "@/utils/matchDataFetcher";
import { useToast } from "@/components/ui/use-toast";
import { BackButton } from "./BackButton";
import { ExitConfirmationDialog } from "./ExitConfirmationDialog";
import { LoadingState } from "./LoadingState";
import { ScoreboardLayout } from "./ScoreboardLayout";

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
  const [isMatchComplete, setIsMatchComplete] = useState(false);

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
    if (isMatchComplete) return;
    setCurrentScore((prev) => ({
      ...prev,
      [team]: prev[team] + 1,
    }));
  };

  const handleTimerComplete = () => {
    if (isBreak) {
      // Break is over, start new set with fresh scores
      setIsBreak(false);
      setCurrentScore({ home: 0, away: 0 });
      handleSwitchTeams();
      
      if (!isMatchComplete) {
        toast({
          title: "Break Time Over",
          description: "Starting next set",
        });
      }
    } else {
      // Set is complete, save scores and start break
      const newSetScores = {
        home: [...setScores.home, currentScore.home],
        away: [...setScores.away, currentScore.away],
      };
      
      console.log('Saving set scores:', newSetScores);
      
      setSetScores(newSetScores);
      setIsBreak(true);
      
      // Check if match should be complete after this set
      if (newSetScores.home.length >= 3) {
        setIsMatchComplete(true);
        toast({
          title: "Match Complete",
          description: "The match has ended",
        });
      } else {
        toast({
          title: "Set Complete",
          description: "Starting 1 minute break",
        });
      }
    }
  };

  const handleSwitchTeams = () => {
    if (isMatchComplete) return;
    setIsTeamsSwitched(!isTeamsSwitched);
    setCurrentScore((prev) => ({
      home: prev.away,
      away: prev.home
    }));
    setSetScores((prev) => ({
      home: [...prev.away],
      away: [...prev.home]
    }));
  };

  const handleBack = () => {
    setShowExitConfirmation(true);
  };

  const confirmExit = () => {
    navigate('/');
  };

  if (isLoading || !match) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-volleyball-red">
      <div className="max-w-[1920px] mx-auto relative h-screen p-6">
        <BackButton onClick={handleBack} />

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
        />

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