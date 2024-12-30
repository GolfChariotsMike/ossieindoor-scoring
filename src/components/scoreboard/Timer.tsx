import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlayCircle, PauseCircle, RotateCcw, ArrowLeftRight } from "lucide-react";

interface TimerProps {
  initialMinutes: number;
  onComplete: () => void;
  onSwitchTeams: () => void;
}

export const Timer = ({ initialMinutes, onComplete, onSwitchTeams }: TimerProps) => {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);

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

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(initialMinutes * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-center">
        <div className="text-volleyball-cream text-[10rem] font-mono tracking-wider">
          {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
        </div>
      </div>
      <div className="flex items-center justify-center space-x-4">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTimer}
          className="bg-volleyball-black hover:bg-volleyball-black/90 text-volleyball-cream w-16 h-16"
        >
          {isRunning ? <PauseCircle className="h-10 w-10" /> : <PlayCircle className="h-10 w-10" />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={resetTimer}
          className="bg-volleyball-black hover:bg-volleyball-black/90 text-volleyball-cream w-16 h-16"
        >
          <RotateCcw className="h-10 w-10" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onSwitchTeams}
          className="bg-volleyball-black hover:bg-volleyball-black/90 text-volleyball-cream w-16 h-16"
        >
          <ArrowLeftRight className="h-10 w-10" />
        </Button>
      </div>
    </div>
  );
};