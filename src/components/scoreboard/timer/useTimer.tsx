
import { useState, useEffect } from "react";
import { MatchPhase } from "./types";

interface UseTimerProps {
  initialMinutes: number;
  onComplete: () => void;
  onSwitchTeams: () => void;
  isBreak: boolean;
  isMatchComplete: boolean;
  fixture?: { Id: string };
}

export const useTimer = ({ 
  initialMinutes, 
  onComplete, 
  onSwitchTeams,
  isBreak,
  isMatchComplete,
  fixture 
}: UseTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [matchPhase, setMatchPhase] = useState<MatchPhase>("not_started");

  // Phase progression
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
    
    if (nextPhase) {
      console.log(`Moving from ${matchPhase} to ${nextPhase}`);
      
      if (nextPhase === 'complete') {
        setIsRunning(false);
        onComplete();
      } else {
        // Set appropriate time for different phases
        const phaseTime = nextPhase === 'break1' || nextPhase === 'break2' || nextPhase === 'final_break' ? 60 : // 60 seconds for all breaks
                         nextPhase === 'results_display' ? 60 : // 60 seconds results
                         initialMinutes * 60; // Regular set time
        
        setTimeLeft(phaseTime);
        setIsRunning(true);
        
        // Only call onComplete for specific phase transitions
        // For final_break -> results_display, we'll handle that separately
        if ((nextPhase.startsWith('set') && currentIndex > 0) || 
            (nextPhase === 'results_display' && matchPhase === 'final_break')) {
          onComplete(); 
        }
      }
      
      setMatchPhase(nextPhase);
    }
  };

  // Handle fixture
  useEffect(() => {
    if (fixture?.Id) {
      setMatchPhase("set1");
      setTimeLeft(initialMinutes * 60);
      setIsRunning(true);
    }
  }, [fixture?.Id, initialMinutes]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0 && !isMatchComplete) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
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
  }, [isRunning, timeLeft, isMatchComplete]);

  // Handle breaks and phase transitions
  useEffect(() => {
    // When a set timer ends, ensure we properly transition to break phases
    if (timeLeft === 0) {
      if (matchPhase === 'set1') {
        // After set 1 ends, transition to break1
        setMatchPhase('break1');
        setTimeLeft(60); // 60 seconds break
        setIsRunning(true);
      } else if (matchPhase === 'set2') {
        // After set 2 ends, transition to break2
        setMatchPhase('break2');
        setTimeLeft(60); // 60 seconds break
        setIsRunning(true);
      } else if (matchPhase === 'set3') {
        // After set 3 ends, transition to final_break
        setMatchPhase('final_break');
        setTimeLeft(60); // 60 seconds final break
        setIsRunning(true);
      } else if (matchPhase === 'final_break') {
        // After final break, go to results display
        setMatchPhase('results_display');
        setTimeLeft(60); // 60 seconds results display
        setIsRunning(true);
        onComplete(); // Notify parent component that we're moving to results
      }
    }
  }, [timeLeft, matchPhase, onComplete]);

  const handleStartStop = () => {
    if (matchPhase === "not_started") {
      setMatchPhase("set1");
      setIsRunning(true);
    } else if (!isMatchComplete) {
      setIsRunning(!isRunning);
    }
  };

  const handleReset = () => {
    if (!isMatchComplete) {
      setTimeLeft(initialMinutes * 60);
      setIsRunning(false);
    }
  };

  const handleSkipPhase = () => {
    setTimeLeft(0);
    progressToNextPhase();
  };

  return {
    timeLeft,
    isRunning,
    matchPhase,
    handleStartStop,
    handleReset,
    handleSkipPhase,
    progressToNextPhase
  };
};
