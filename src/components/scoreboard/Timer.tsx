import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, ArrowLeftRight } from "lucide-react";

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
      <div className="text-[12rem] font-mono tracking-[0.2em] leading-none mb-8">
        {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
      </div>
      
      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={handleStartStop}
          className="bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90 border-volleyball-cream"
        >
          <Play className="mr-2" />
          {isRunning ? "Stop" : "Start"} Time
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={handleReset}
          className="bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90 border-volleyball-cream"
        >
          <RotateCcw className="mr-2" />
          Reset Time
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={onSwitchTeams}
          className="bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90 border-volleyball-cream"
        >
          <ArrowLeftRight className="mr-2" />
          Switch Sides
        </Button>
      </div>
    </div>
  );
};