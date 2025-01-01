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

type MatchPhase = 
  | "not_started"
  | "set1"
  | "break1"
  | "set2"
  | "break2"
  | "set3"
  | "complete";

export const Timer = ({ 
  initialMinutes, 
  onComplete, 
  onSwitchTeams,
  isBreak,
  isMatchComplete 
}: TimerProps) => {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [matchPhase, setMatchPhase] = useState<MatchPhase>("not_started");

  // Reset timer to initial state
  const resetTimer = () => {
    console.log('Timer reset for phase:', matchPhase);
    setTimeLeft(initialMinutes * 60);
    setIsRunning(false);
  };

  // Progress to next match phase
  const progressToNextPhase = () => {
    const phases: MatchPhase[] = [
      "not_started", 
      "set1", 
      "break1", 
      "set2", 
      "break2", 
      "set3",
      "complete"
    ];
    const currentIndex = phases.indexOf(matchPhase);
    const nextPhase = phases[currentIndex + 1];
    
    console.log('Progressing from', matchPhase, 'to', nextPhase);
    
    if (nextPhase) {
      setMatchPhase(nextPhase);
      
      // Handle phase transitions
      if (nextPhase.includes('break')) {
        console.log('Starting break timer');
        onComplete(); // Notify parent set is over
        setTimeLeft(60); // 1 minute break
        setIsRunning(true); // Auto-start break timer
      } else if (nextPhase === 'complete') {
        console.log('Match complete');
        onComplete(); // Notify parent match is complete
        setIsRunning(false);
      } else {
        console.log('Starting new set');
        onComplete(); // Notify parent break is over
        setTimeLeft(initialMinutes * 60);
        setIsRunning(true); // Auto-start set timer
      }
    }
  };

  // Timer countdown logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0 && matchPhase !== 'complete') {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (interval) clearInterval(interval);
            progressToNextPhase();
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
  }, [isRunning, timeLeft, matchPhase]);

  // Effect to handle isBreak prop changes
  useEffect(() => {
    if (isBreak && matchPhase.includes('set')) {
      const breakPhase = `break${matchPhase.charAt(3)}` as MatchPhase;
      setMatchPhase(breakPhase);
      setTimeLeft(60);
      setIsRunning(true); // Auto-start break timer
      console.log('Auto-starting break timer');
    }
  }, [isBreak, matchPhase]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleStartStop = () => {
    console.log('Start/Stop clicked, current phase:', matchPhase);
    
    if (matchPhase === "not_started") {
      console.log('Starting first set');
      setMatchPhase("set1");
      setIsRunning(true);
    } else if (!isMatchComplete) {
      setIsRunning(!isRunning);
    }
  };

  const handleReset = () => {
    if (!isMatchComplete) {
      console.log('Manual timer reset');
      resetTimer();
    }
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