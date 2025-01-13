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
}

export const Timer = ({ 
  initialMinutes = 14,
  onComplete, 
  onSwitchTeams,
  isBreak,
  isMatchComplete,
  fixture
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

  return (
    <div className="text-[#FFFFFF] text-center relative">
      <div className="absolute top-0 right-0">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSkipPhase}
          disabled={isMatchComplete}
          className="bg-volleyball-black text-[#FFFFFF] hover:bg-volleyball-black/90 border-[#FFFFFF] disabled:opacity-50"
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