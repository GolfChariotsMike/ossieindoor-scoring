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
    console.log('Timer reset');
    setTimeLeft(initialMinutes * 60);
    setIsRunning(false);
  }, [initialMinutes]);

  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
    console.log('Timer complete, isBreak:', isBreak);
    setIsRunning(false);

    if (isBreak) {
      console.log('Break ended - switching teams and starting new set');
      onComplete(); // Notify parent break is over
      onSwitchTeams(); // Switch team positions
      resetTimer(); // Reset timer for new set
    } else {
      console.log('Set ended - starting break');
      onComplete(); // Notify parent set is over
    }
  }, [isBreak, onComplete, onSwitchTeams, resetTimer]);

  // Handle break transitions
  useEffect(() => {
    console.log('Break status changed:', isBreak);
    if (isMatchComplete) {
      console.log('Match is complete - stopping timer');
      setIsRunning(false);
      return;
    }

    // Reset timer when break status changes
    resetTimer();
    
    // Auto-start break timer if game has started
    if (hasGameStarted && isBreak) {
      console.log('Auto-starting break timer');
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

  const handleStartStop = () => {
    if (isMatchComplete) return;
    
    console.log('Start/Stop clicked, current state:', { isRunning, hasGameStarted });
    
    if (!hasGameStarted) {
      console.log('Starting game for the first time');
      setHasGameStarted(true);
    }
    
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    if (isMatchComplete) return;
    console.log('Manual timer reset');
    resetTimer();
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