import { Match, SetScores } from "@/types/volleyball";
import { Fireworks } from "./Fireworks";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";
import { SkipForward } from "lucide-react";
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
  onNextMatch: () => void;
  onEndOfNight: boolean;
}

export const ResultsScreen = ({ match, setScores, onNextMatch, onEndOfNight }: ResultsScreenProps) => {
  const [countdown, setCountdown] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLongPress, setIsLongPress] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();
  const longPressDelay = 5000; // 5 seconds

  const RESULTS_DISPLAY_DURATION = 50; // Changed back to 50 seconds - MUST match ScoreboardContainer

  const calculateTeamResults = () => {
    const homeScore = setScores.home.reduce((acc, score) => acc + score, 0);
    const awayScore = setScores.away.reduce((acc, score) => acc + score, 0);
    return { homeScore, awayScore };
  };

  const { homeScore, awayScore } = calculateTeamResults();

  const handleNextMatch = () => {
    onNextMatch();
  };

  const handleLongPress = () => {
    setDialogOpen(true);
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    timerRef.current = setTimeout(handleLongPress, longPressDelay);
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const handleTouchCancel = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (timerRef.current) {
      clearTimeout(timerRef.current);
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
    <div className="flex flex-col items-center justify-center h-full">
      <Fireworks />
      <h1 className="text-2xl font-bold mb-4">Match Results</h1>
      <div className="text-lg">
        <p>{match.homeTeam.name}: {homeScore}</p>
        <p>{match.awayTeam.name}: {awayScore}</p>
      </div>
      <div className="mt-4">
        <Button onClick={handleNextMatch} className="bg-green-500 text-white">
          Next Match <SkipForward />
        </Button>
      </div>
      <p className="mt-4">{countdown}</p>
      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Do you want to proceed to the next match?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleNextMatch}>Proceed</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
