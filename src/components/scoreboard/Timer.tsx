import { TimerDisplay } from "./TimerDisplay";
import { TimerControls } from "./TimerControls";
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
  initialMinutes, 
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
    <div className="text-volleyball-cream text-center relative">
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