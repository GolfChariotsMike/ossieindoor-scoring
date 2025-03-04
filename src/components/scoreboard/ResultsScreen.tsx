import { Match, SetScores } from "@/types/volleyball";
import { Fireworks } from "./Fireworks";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
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
  onStartNextMatch?: () => void;
}

export const ResultsScreen = ({ match, setScores, isTeamsSwitched, onStartNextMatch }: ResultsScreenProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLongPress, setIsLongPress] = useState(false);
  const [countdown, setCountdown] = useState<string>("");
  const [scoresSaved, setScoresSaved] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();
  const longPressDelay = 5000; // 5 seconds

  const RESULTS_DISPLAY_DURATION = 20; // 20 seconds - MUST match ScoreboardContainer

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

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    console.log('Touch start');
    timerRef.current = setTimeout(() => {
      console.log('Long press detected');
      setIsLongPress(true);
      setDialogOpen(true);
    }, longPressDelay);
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    console.log('Touch end, isLongPress:', isLongPress);
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    setIsLongPress(false);
  };

  const handleTouchCancel = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    console.log('Touch cancelled');
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsLongPress(false);
  };

  const handleStartNext = () => {
    if (onStartNextMatch) {
      // Mark that scores are saved for this match
      setScoresSaved(true);
      onStartNextMatch();
      setDialogOpen(false);
    }
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
            <Button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                console.log('Next match button clicked');
              }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchCancel}
              onMouseDown={handleTouchStart}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchCancel}
              className={`bg-volleyball-red text-white hover:bg-volleyball-red/90 text-2xl py-8 px-12 rounded-xl font-bold shadow-lg animate-pulse-scale
                ${isLongPress ? 'bg-volleyball-red/70' : 'bg-volleyball-red'}`}
            >
              <ArrowRight className="w-8 h-8 mr-3" />
              Start Next Match
            </Button>

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
          </div>
        )}
      </div>
    </div>
  );
};
