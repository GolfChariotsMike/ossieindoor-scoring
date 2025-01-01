import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, ArrowLeftRight } from "lucide-react";

interface TimerProps {
  initialMinutes: number;
  onComplete: () => void;
  onSwitchTeams: () => void;
  isBreak: boolean;
  isMatchComplete: boolean;
}

export const Timer = ({ 
  initialMinutes, 
  onComplete, 
  onSwitchTeams, 
  isBreak,
  isMatchComplete 
}: TimerProps) => {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (isMatchComplete) {
      setIsRunning(false);
      return;
    }
    
    // Reset timer when break status changes, but don't auto-start
    setTimeLeft(initialMinutes * 60);
  }, [initialMinutes, isBreak, isMatchComplete]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0 && !isMatchComplete) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsRunning(false);
            onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onComplete, isMatchComplete]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleReset = () => {
    if (isMatchComplete) return;
    setIsRunning(false);
    setTimeLeft(initialMinutes * 60);
  };

  const handleStartStop = () => {
    if (isMatchComplete) return;
    setIsRunning(!isRunning);
  };

  return (
    <div className="text-volleyball-cream text-center">
      <div 
        className={`font-score text-[12rem] tracking-[0.2em] leading-none mb-2 [text-shadow:_2px_2px_0_rgb(0_0_0)] ${
          isBreak ? 'text-blue-400' : isMatchComplete ? 'text-green-400' : 'text-volleyball-cream'
        }`}
      >
        {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
      </div>
      
      <div className="flex justify-center gap-4 mb-1">
        <Button
          variant="outline"
          size="icon"
          onClick={handleStartStop}
          disabled={isMatchComplete}
          className="bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90 border-volleyball-cream disabled:opacity-50"
        >
          <Play />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handleReset}
          disabled={isMatchComplete}
          className="bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90 border-volleyball-cream disabled:opacity-50"
        >
          <RotateCcw />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={onSwitchTeams}
          disabled={isMatchComplete}
          className="bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90 border-volleyball-cream disabled:opacity-50"
        >
          <ArrowLeftRight />
        </Button>
      </div>
    </div>
  );
};