import { useState, useEffect } from "react";
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

  // Auto-start timer when break begins or new set starts
  useEffect(() => {
    if (isMatchComplete) {
      setIsRunning(false);
      return;
    }
    
    setTimeLeft(initialMinutes * 60);
    
    // Auto-start timer if:
    // 1. It's a break (between sets)
    // 2. It's a new set AND the game has already started
    if (isBreak || hasGameStarted) {
      setIsRunning(true);
    }
  }, [initialMinutes, isBreak, isMatchComplete, hasGameStarted]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0 && !isMatchComplete) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsRunning(false);
            onComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onComplete, isMatchComplete]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleReset = () => {
    if (isMatchComplete) return;
    setIsRunning(false);
    setTimeLeft(initialMinutes * 60);
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