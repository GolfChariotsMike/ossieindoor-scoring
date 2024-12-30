import { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Score, SetScores, Match, Fixture } from "@/types/volleyball";
import { useQuery } from "@tanstack/react-query";
import { fetchMatchData } from "@/utils/matchDataFetcher";
import { Timer } from "./scoreboard/Timer";
import { useToast } from "@/components/ui/use-toast";
import { BackButton } from "./scoreboard/BackButton";
import { TeamScore } from "./scoreboard/TeamScore";
import { SetScoresDisplay } from "./scoreboard/SetScoresDisplay";
import { ExitConfirmationDialog } from "./scoreboard/ExitConfirmationDialog";

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
    if (isMatchComplete) return;

    if (isBreak) {
      // Break is over, start new set
      setIsBreak(false);
      setCurrentScore({ home: 0, away: 0 });
      handleSwitchTeams();
      toast({
        title: "Break Time Over",
        description: "Starting next set",
      });
    } else {
      // Set is complete, save current scores to set scores
      const updatedSetScores = {
        home: [...setScores.home, currentScore.home],
        away: [...setScores.away, currentScore.away],
      };
      
      console.log('Current scores being saved:', currentScore);
      console.log('Updated set scores:', updatedSetScores);
      
      setSetScores(updatedSetScores);
      setIsBreak(true);

      // Check if match should be complete
      if (updatedSetScores.home.length >= 3) {
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
    
    // Switch current scores
    setCurrentScore((prev) => ({
      home: prev.away,
      away: prev.home
    }));
    
    // Switch set scores by creating new arrays with swapped values
    setSetScores((prev) => {
      const homeScores = [...prev.home];
      const awayScores = [...prev.away];
      return {
        home: awayScores,
        away: homeScores
      };
    });
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

          <div className="grid grid-cols-[1fr_auto_1fr] gap-8 items-center mb-8">
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