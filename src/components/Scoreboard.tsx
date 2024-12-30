import { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Score, SetScores, Match, Fixture } from "@/types/volleyball";
import { useQuery } from "@tanstack/react-query";
import { fetchMatchData } from "@/utils/matchDataFetcher";
import { MatchHeader } from "./scoreboard/MatchHeader";
import { TeamScore } from "./scoreboard/TeamScore";
import { SetScoresDisplay } from "./scoreboard/SetScoresDisplay";
import { Timer } from "./scoreboard/Timer";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "./ui/button";
import { ArrowLeftRight, ArrowLeft } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
      <div className="min-h-screen bg-volleyball-navy flex items-center justify-center">
        <div className="text-white text-2xl">Loading match data...</div>
      </div>
    );
  }

  const homeTeam = isTeamsSwitched ? match.awayTeam : match.homeTeam;
  const awayTeam = isTeamsSwitched ? match.homeTeam : match.awayTeam;

  return (
    <div className="min-h-screen bg-volleyball-navy p-4">
      <div className="max-w-4xl mx-auto relative">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          className="absolute left-0 top-0 bg-volleyball-lightBlue hover:bg-volleyball-gold"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="bg-volleyball-darkBlue rounded-lg p-6 mb-4 mt-12">
          <MatchHeader 
            court={match.court} 
            startTime={match.startTime} 
            division={match.division}
          />

          <div className="mb-6">
            <Timer
              initialMinutes={isBreak ? 1 : 14}
              onComplete={handleTimerComplete}
            />
          </div>

          <div className="flex justify-center mb-4">
            <Button
              variant="outline"
              onClick={handleSwitchTeams}
              className="bg-volleyball-lightBlue hover:bg-volleyball-gold"
            >
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              Switch Teams
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 items-center">
            <TeamScore
              teamName={homeTeam.name}
              score={currentScore.home}
              onScoreUpdate={() => handleScore("home")}
            />

            <div className="text-white text-4xl text-center">vs</div>

            <TeamScore
              teamName={awayTeam.name}
              score={currentScore.away}
              onScoreUpdate={() => handleScore("away")}
            />
          </div>
        </div>

        <SetScoresDisplay setScores={setScores} />

        <AlertDialog open={showExitConfirmation} onOpenChange={setShowExitConfirmation}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to exit?</AlertDialogTitle>
              <AlertDialogDescription>
                All score data will be lost if you haven't submitted the match results.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmExit}>Exit</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Scoreboard;