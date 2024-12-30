import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PlayCircle, PauseCircle, RotateCcw } from "lucide-react";

interface TimerProps {
  initialMinutes: number;
  onComplete: () => void;
}

export const Timer = ({ initialMinutes, onComplete }: TimerProps) => {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const totalTime = initialMinutes * 60;

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
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-center mb-4">
        <div className="text-5xl font-bold text-white">
          {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
        </div>
      </div>
      <div className="flex items-center justify-center space-x-2 mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTimer}
          className="bg-volleyball-lightBlue hover:bg-volleyball-gold"
        >
          {isRunning ? <PauseCircle className="h-6 w-6" /> : <PlayCircle className="h-6 w-6" />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={resetTimer}
          className="bg-volleyball-lightBlue hover:bg-volleyball-gold"
        >
          <RotateCcw className="h-6 w-6" />
        </Button>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
};