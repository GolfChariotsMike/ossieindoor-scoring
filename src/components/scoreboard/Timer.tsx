import { TimerDisplay } from "./TimerDisplay";
import { TimerControls } from "./TimerControls";
import { Button } from "@/components/ui/button";
import { FastForward } from "lucide-react";
import { useTimer } from "./timer/useTimer";

interface TimerProps {
  initialMinutes: number;
  onComplete: () => void;
  onSwitchTeams: () => void;
  isBreak: boolean;
  isMatchComplete: boolean;
  fixture?: { Id: string };
  className?: string;
}

export const Timer = ({ 
  initialMinutes = 14,
  onComplete, 
  onSwitchTeams,
  isBreak,
  isMatchComplete,
  fixture,
  className
}: TimerProps) => {
  const {
    timeLeft,
    handleStartStop,
    handleReset,
    handleSkipPhase,
    progressToNextPhase
  } = useTimer({
    initialMinutes,
    onComplete,
    onSwitchTeams,
    isBreak,
    isMatchComplete,
    fixture
  });

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const timerClassName = isBreak 
    ? "text-volleyball-black [text-shadow:_2px_2px_0_rgb(255,255,255),_-2px_-2px_0_rgb(255,255,255),_2px_-2px_0_rgb(255,255,255),_-2px_2px_0_rgb(255,255,255)]"
    : "text-volleyball-cream [text-shadow:_4px_4px_0_rgb(0,0,0)]";

  return (
    <div className="text-center relative">
      <div className="absolute top-0 right-0">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSkipPhase}
          disabled={isMatchComplete}
          className="bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90 border-volleyball-cream disabled:opacity-50"
        >
          <FastForward className="w-4 h-4 mr-1" />
          Skip Phase
        </Button>
      </div>
      
      <TimerDisplay 
        minutes={minutes}
        seconds={seconds}
        isBreak={isBreak}
        isMatchComplete={isMatchComplete}
        className={timerClassName}
      />
      
      <TimerControls 
        isMatchComplete={isMatchComplete}
        onStartStop={handleStartStop}
        onReset={handleReset}
        onSwitchTeams={onSwitchTeams}
      />
    </div>
  );
};