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

  // Reset timer to initial state
  const resetTimer = useCallback(() => {
    setTimeLeft(initialMinutes * 60);
    setIsRunning(false);
  }, [initialMinutes]);

  // Handle what happens when timer reaches zero
  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    
    if (isBreak) {
      // When break ends, notify parent and switch teams
      onComplete();
      onSwitchTeams();
      // Reset timer for next set
      resetTimer();
    } else {
      // When set ends, notify parent
      onComplete();
    }
  }, [isBreak, onComplete, onSwitchTeams, resetTimer]);

  // Handle break transitions
  useEffect(() => {
    if (isMatchComplete) {
      setIsRunning(false);
      return;
    }

    // Reset timer when break status changes
    resetTimer();
    
    // Auto-start timer if game has started and it's break time
    if (hasGameStarted && isBreak) {
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
            handleTimerComplete();
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
  }, [isRunning, timeLeft, handleTimerComplete, isMatchComplete]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleReset = () => {
    if (isMatchComplete) return;
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