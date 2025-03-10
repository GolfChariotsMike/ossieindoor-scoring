import { Match, SetScores } from "@/types/volleyball";
import { Fireworks } from "./Fireworks";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Flag } from "lucide-react";
import { useState, useEffect } from "react";
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

interface ResultsScreenProps {
  match: Match;
  setScores: SetScores;
  isTeamsSwitched: boolean;
  onStartNextMatch: () => void;
  onEndOfNight?: () => void;
  nextMatchReady?: boolean;
}

export const ResultsScreen = ({ match, setScores, isTeamsSwitched, onStartNextMatch, onEndOfNight, nextMatchReady }: ResultsScreenProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [endOfNightDialogOpen, setEndOfNightDialogOpen] = useState(false);
  const [scoresSaved, setScoresSaved] = useState(false);
  const [countdown, setCountdown] = useState<string>("");

  const RESULTS_DISPLAY_DURATION = 50; // 50 seconds - MUST match ScoreboardContainer

  const calculateTeamResults = (teamScores: number[], opposingScores: number[], teamName: string) => {
    let setPoints = 0;
    let drawPoints = 0;
    
    teamScores.forEach((score, index) => {
      if (score > opposingScores[index]) {
        setPoints += 2;
      } else if (score === opposingScores[index]) {
        drawPoints += 1;
      }
    });
    
    const bonusPoints = teamScores.reduce((total, score) => total + Math.floor(score / 10), 0);
    
    return {
      name: teamName,
      setPoints,
      drawPoints,
      bonusPoints,
      totalPoints: setPoints + drawPoints + bonusPoints
    };
  };

  const homeTeam = isTeamsSwitched ? match.awayTeam : match.homeTeam;
  const awayTeam = isTeamsSwitched ? match.homeTeam : match.awayTeam;

  const homeResults = calculateTeamResults(
    isTeamsSwitched ? setScores.away : setScores.home,
    isTeamsSwitched ? setScores.home : setScores.away,
    homeTeam.name
  );
  
  const awayResults = calculateTeamResults(
    isTeamsSwitched ? setScores.home : setScores.away,
    isTeamsSwitched ? setScores.away : setScores.home,
    awayTeam.name
  );

  const getWinnerText = () => {
    if (homeResults.totalPoints > awayResults.totalPoints) {
      return `${homeResults.name} Wins!`;
    } else if (awayResults.totalPoints > homeResults.totalPoints) {
      return `${awayResults.name} Wins!`;
    }
    return "It's a Draw!";
  };

  const handleStartNext = () => {
    if (onStartNextMatch) {
      setScoresSaved(true);
      onStartNextMatch();
      setDialogOpen(false);
    }
  };

  const handleEndOfNight = () => {
    setEndOfNightDialogOpen(true);
  };

  const confirmEndOfNight = () => {
    if (onEndOfNight) {
      onEndOfNight();
    }
    setEndOfNightDialogOpen(false);
  };

  useEffect(() => {
    console.log(`Results screen countdown started for ${RESULTS_DISPLAY_DURATION} seconds`);
    const startTime = Date.now();
    let timeLeft = RESULTS_DISPLAY_DURATION;

    const interval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      timeLeft = Math.max(0, RESULTS_DISPLAY_DURATION - elapsedSeconds);
      
      if (timeLeft <= 0) {
        setCountdown("Starting next match...");
        console.log('Countdown complete, next match should start soon');
        clearInterval(interval);
      } else {
        setCountdown(`Auto-starting next match in ${timeLeft} seconds`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="absolute inset-0">
        <Fireworks />
      </div>
      <div className="relative z-10 w-[90%] max-w-7xl">
        <h1 className="text-8xl font-sets mb-16 text-black text-center animate-[scale_2s_ease-in-out_infinite] drop-shadow-lg">
          {getWinnerText()}
        </h1>
        
        <div className="grid grid-cols-2 gap-16 mb-12">
          {[homeResults, awayResults].map((result) => (
            <div 
              key={result.name}
              className="bg-volleyball-black/90 rounded-2xl p-10 flex flex-col items-center transition-transform hover:scale-105 duration-300 backdrop-blur-sm"
            >
              <h2 className="text-6xl font-sets mb-10 text-white animate-fade-in">
                {result.name}
              </h2>
              <div className="space-y-8 text-4xl font-score text-white">
                <p className="animate-scale-in">Set Points: {result.setPoints}</p>
                <p className="animate-scale-in delay-75">Draw Points: {result.drawPoints}</p>
                <p className="animate-scale-in delay-150">Bonus Points: {result.bonusPoints}</p>
                <div className="w-full h-px bg-white/20 my-8"></div>
                <p className="text-5xl animate-[pulse_3s_ease-in-out_infinite]">
                  Total: {result.totalPoints}
                </p>
              </div>
            </div>
          ))}
        </div>

        {onStartNextMatch && (
          <div className="relative z-10 flex flex-col items-center justify-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <p className="text-2xl font-score text-black animate-pulse">
                {scoresSaved ? "Scores saved locally" : "Scores saved locally. Submit all scores at the end of the night."}
              </p>
              {scoresSaved && <CheckCircle className="text-green-600 w-6 h-6" />}
            </div>
            <p className="text-2xl font-score text-black mb-2 animate-pulse">
              {countdown}
            </p>
            <div className="flex gap-4">
              <Button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Next match button clicked');
                  setDialogOpen(true);
                }}
                className="bg-volleyball-red text-white hover:bg-volleyball-red/90 text-2xl py-8 px-12 rounded-xl font-bold shadow-lg animate-pulse-scale"
              >
                <ArrowRight className="w-8 h-8 mr-3" />
                Start Next Match
              </Button>
              
              {onEndOfNight && (
                <Button
                  type="button"
                  onClick={handleEndOfNight}
                  className="bg-volleyball-black text-white hover:bg-volleyball-black/90 text-2xl py-8 px-12 rounded-xl font-bold shadow-lg"
                >
                  <Flag className="w-8 h-8 mr-3" />
                  END OF NIGHT
                </Button>
              )}
            </div>

            <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to start the next match?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action should only be used if you are ready to proceed to the next match. 
                    All scores will be saved locally and can be uploaded at the end of the night.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleStartNext}>Start Next Match</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={endOfNightDialogOpen} onOpenChange={setEndOfNightDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Finalize All Results for the Night?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will take you to the end of night summary where you can review and submit all match scores. 
                    Are you sure there are no more matches to score tonight?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmEndOfNight}>Finalize Results</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </div>
  );
};
