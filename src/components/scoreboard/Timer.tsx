import { useState, useEffect, useCallback } from "react";
import { TimerDisplay } from "./TimerDisplay";
import { TimerControls } from "./TimerControls";

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
  const [hasGameStarted, setHasGameStarted] = useState(false);

  const resetTimer = useCallback(() => {
    setTimeLeft(initialMinutes * 60);
  }, [initialMinutes]);

  // Handle timer completion
  const handleComplete = useCallback(() => {
    setIsRunning(false);
    onComplete();
  }, [onComplete]);

  // Reset timer when break status changes
  useEffect(() => {
    if (isMatchComplete) {
      setIsRunning(false);
      return;
    }

    resetTimer();
    
    // Auto-start timer for breaks or if game has started
    if (hasGameStarted) {
      setIsRunning(true);
    }
  }, [isBreak, isMatchComplete, resetTimer, hasGameStarted]);

  // Timer countdown logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0 && !isMatchComplete) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (interval) clearInterval(interval);
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, timeLeft, handleComplete, isMatchComplete]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleReset = () => {
    if (isMatchComplete) return;
    setIsRunning(false);
    resetTimer();
  };

  const handleStartStop = () => {
    if (isMatchComplete) return;
    if (!hasGameStarted) {
      setHasGameStarted(true);
    }
    setIsRunning(!isRunning);
  };

  return (
    <div className="text-volleyball-cream text-center">
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