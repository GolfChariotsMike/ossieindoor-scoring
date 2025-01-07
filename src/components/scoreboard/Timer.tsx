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
  timeLeft?: number;
  isReadOnly?: boolean;
}

export const Timer = ({ 
  initialMinutes = 14,
  onComplete, 
  onSwitchTeams,
  isBreak,
  isMatchComplete,
  fixture,
  timeLeft: externalTimeLeft,
  isReadOnly = false
}: TimerProps) => {
  const {
    timeLeft: internalTimeLeft,
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

  const timeLeft = externalTimeLeft ?? internalTimeLeft;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="text-volleyball-cream text-center relative">
      {!isReadOnly && (
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
      )}
      
      <TimerDisplay 
        minutes={minutes}
        seconds={seconds}
        isBreak={isBreak}
        isMatchComplete={isMatchComplete}
      />
      
      {!isReadOnly && (
        <TimerControls 
          isMatchComplete={isMatchComplete}
          onStartStop={handleStartStop}
          onReset={handleReset}
          onSwitchTeams={onSwitchTeams}
        />
      )}
    </div>
  );
};