
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Score, SetScores } from "@/types/volleyball";
import { useToast } from "@/hooks/use-toast";
import { BackButton } from "./BackButton";
import { ExitConfirmationDialog } from "./ExitConfirmationDialog";
import { ScoreboardLayout } from "./ScoreboardLayout";
import { format, parse } from "date-fns";
import { saveMatchScores } from "@/utils/matchDatabase";

const StandaloneScoreboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // FIX: Create startTime only once when component mounts, not on every render
  const [startTime] = useState(() => new Date().toISOString());
  const [currentScore, setCurrentScore] = useState<Score>({ home: 0, away: 0 });
  const [setScores, setSetScores] = useState<SetScores>({ home: [], away: [] });
  const [isBreak, setIsBreak] = useState(false);
  const [isTeamsSwitched, setIsTeamsSwitched] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [isMatchComplete, setIsMatchComplete] = useState(false);

  // These values are now stable since startTime doesn't change
  const courtNumber = 0;
  const formattedDate = format(new Date(startTime), 'yyyyMMdd-HHmm');
  const homeTeamName = "HOME TEAM";
  const awayTeamName = "AWAY TEAM";
  const matchCode = `${courtNumber}-${formattedDate}-${homeTeamName.replace(/\s+/g, '')}-${awayTeamName.replace(/\s+/g, '')}`;

  // Create a properly formatted fixture time (in the same format as expected from fixtures)
  const fixtureDateTime = format(new Date(startTime), 'dd/MM/yyyy HH:mm');

  const genericMatch = {
    id: matchCode,
    court: courtNumber,
    startTime,
    homeTeam: { id: "home", name: homeTeamName },
    awayTeam: { id: "away", name: awayTeamName },
    PlayingAreaName: `Court ${courtNumber}`,
    DateTime: fixtureDateTime, // Use the formatted date here
    DivisionName: "Practice",
    HomeTeam: homeTeamName,
    AwayTeam: awayTeamName,
    HomeTeamId: "home",
    AwayTeamId: "away"
  };

  const handleScore = (team: "home" | "away", increment: boolean = true) => {
    if (isMatchComplete) return;
    setCurrentScore((prev) => ({
      ...prev,
      [team]: increment ? prev[team] + 1 : Math.max(0, prev[team] - 1),
    }));
  };

  const handleTimerComplete = () => {
    if (isBreak) {
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
      // Only proceed if there are actual scores
      if (currentScore.home === 0 && currentScore.away === 0) {
        return;
      }

      const currentHomeScore = isTeamsSwitched ? currentScore.away : currentScore.home;
      const currentAwayScore = isTeamsSwitched ? currentScore.home : currentScore.away;
      
      const newSetScores = {
        home: [...setScores.home, currentHomeScore],
        away: [...setScores.away, currentAwayScore],
      };
      
      setSetScores(newSetScores);
      setIsBreak(true);
      
      // Save match scores after each set
      try {
        // Use the formatted fixture time from genericMatch
        const fixtureTime = genericMatch.DateTime;
        console.log('StandaloneScoreboard saving set scores with fixture time:', {
          matchCode,
          fixtureTime,
          startTime,
          homeTeam: homeTeamName,
          awayTeam: awayTeamName
        });
        
        // Pass both the display fixture time and the full ISO date
        saveMatchScores(
          matchCode,
          newSetScores.home,
          newSetScores.away,
          false, // Don't immediately submit to Supabase
          fixtureTime, // Pass formatted fixture time (dd/MM/yyyy HH:mm)
          startTime,  // Pass full ISO date string
          homeTeamName,
          awayTeamName
        );
      } catch (error) {
        console.error('Error saving match scores:', error);
      }
      
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
  };

  const handleBack = () => {
    setShowExitConfirmation(true);
  };

  const confirmExit = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-volleyball-red">
      <div className="max-w-[1920px] mx-auto relative h-screen p-6">
        <BackButton onClick={handleBack} />

        <ScoreboardLayout
          isBreak={isBreak}
          currentScore={currentScore}
          setScores={setScores}
          match={genericMatch}
          isTeamsSwitched={isTeamsSwitched}
          isMatchComplete={isMatchComplete}
          onTimerComplete={() => handleTimerComplete()}
          onSwitchTeams={handleSwitchTeams}
          onScoreUpdate={handleScore}
          onAceBlock={(team, type) => console.log(`${team} ${type}`)}
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

export default StandaloneScoreboard;
