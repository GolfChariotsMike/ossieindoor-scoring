import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, ArrowLeftRight } from "lucide-react";

interface TimerProps {
  initialMinutes: number;
  onComplete: () => void;
  onSwitchTeams: () => void;
  isBreak: boolean;
}

export const Timer = ({ initialMinutes, onComplete, onSwitchTeams, isBreak }: TimerProps) => {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    setTimeLeft(initialMinutes * 60);
  }, [initialMinutes]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onComplete]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(initialMinutes * 60);
  };

  const handleStartStop = () => {
    setIsRunning(!isRunning);
  };

  return (
    <div className="text-volleyball-cream text-center">
      <div 
        className={`font-score text-[12rem] tracking-[0.2em] leading-none mb-2 [text-shadow:_2px_2px_0_rgb(0_0_0)] ${
          isBreak ? 'text-blue-400' : 'text-volleyball-cream'
        }`}
      >
        {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
      </div>
      
      <div className="flex justify-center gap-4 mb-1">
        <Button
          variant="outline"
          size="icon"
          onClick={handleStartStop}
          className="bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90 border-volleyball-cream"
        >
          <Play />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handleReset}
          className="bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90 border-volleyball-cream"
        >
          <RotateCcw />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={onSwitchTeams}
          className="bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90 border-volleyball-cream"
        >
          <ArrowLeftRight />
        </Button>
      </div>
    </div>
  );
};