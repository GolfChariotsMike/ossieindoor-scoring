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
  | "final_break"
  | "results_display"
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

  const resetTimer = () => {
    setTimeLeft(initialMinutes * 60);
    setIsRunning(false);
  };

  const progressToNextPhase = () => {
    const phases: MatchPhase[] = [
      "not_started", 
      "set1", 
      "break1", 
      "set2", 
      "break2", 
      "set3",
      "final_break",
      "results_display",
      "complete"
    ];
    
    const currentIndex = phases.indexOf(matchPhase);
    const nextPhase = phases[currentIndex + 1];
    
    console.log('Current phase:', matchPhase, 'Next phase:', nextPhase);
    
    if (nextPhase) {
      if (nextPhase.startsWith('set')) {
        console.log('Starting set:', nextPhase);
        setMatchPhase(nextPhase);
        if (nextPhase !== 'set1') {
          onComplete(); // Notify parent break is over
        }
        setTimeLeft(initialMinutes * 60);
        setIsRunning(true);
      } else if (nextPhase.startsWith('break')) {
        console.log('Starting break:', nextPhase);
        setMatchPhase(nextPhase);
        onComplete(); // Notify parent set is over
        setTimeLeft(60); // 1 minute break
        setIsRunning(true);
      } else if (nextPhase === 'final_break') {
        console.log('Starting final break');
        setMatchPhase(nextPhase);
        onComplete(); // Notify parent set is over
        setTimeLeft(30); // 30 seconds final break
        setIsRunning(true);
      } else if (nextPhase === 'results_display') {
        console.log('Starting results display');
        setMatchPhase(nextPhase);
        setTimeLeft(30); // 30 seconds results display
        setIsRunning(true);
      } else if (nextPhase === 'complete') {
        console.log('Match complete');
        setMatchPhase(nextPhase);
        onComplete(); // Notify parent match is complete
        setIsRunning(false);
      }
    }
  };

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

  useEffect(() => {
    if (isBreak && matchPhase.includes('set')) {
      const currentSetNumber = parseInt(matchPhase.charAt(3));
      console.log('Current set number:', currentSetNumber);
      
      if (currentSetNumber === 3) {
        console.log('Moving to final break from set 3');
        setMatchPhase('final_break');
        setTimeLeft(30); // 30 seconds final break
      } else {
        console.log('Moving to break', currentSetNumber, 'from set', currentSetNumber);
        const breakPhase = `break${currentSetNumber}` as MatchPhase;
        setMatchPhase(breakPhase);
        setTimeLeft(60); // 1 minute regular break
      }
      setIsRunning(true);
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