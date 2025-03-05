
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
        const phaseTime = nextPhase.includes('break') ? 60 : // 60 seconds for all breaks
                         initialMinutes * 60; // Regular set time
        
        setTimeLeft(phaseTime);
        setIsRunning(true);
        
        // Call onComplete when transitioning to a new set or break
        // This ensures consistent behavior with the skip function
        if (nextPhase.startsWith('set') || nextPhase.includes('break')) {
          if (currentIndex > 0) { // Don't call for the initial transition to set1
            onComplete();
          }
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

  // Handle end of sets and ensure final break is shown
  useEffect(() => {
    if (isBreak && matchPhase.includes('set') && timeLeft === 0) {
      // Get the set number from the current phase (e.g., "set3" -> 3)
      const currentSetNumber = parseInt(matchPhase.charAt(3));
      
      if (currentSetNumber >= 1 && currentSetNumber <= 3) {
        // Determine next phase: If set3, go to final_break; otherwise, break1 or break2
        const nextPhase = currentSetNumber === 3 ? 'final_break' : `break${currentSetNumber}`;
        console.log(`Set ${currentSetNumber} ended, moving to ${nextPhase}`);
        
        setMatchPhase(nextPhase as MatchPhase);
        setTimeLeft(60); // Set all breaks to 60 seconds
        setIsRunning(true);
        
        // Ensure onComplete is called here too, for consistency with skip function
        onComplete();
      }
    }
  }, [isBreak, matchPhase, timeLeft, onComplete]);

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

  // Modified handleSkipPhase to handle special case for set3
  const handleSkipPhase = () => {
    // Special handling for set3 to ensure final_break is shown
    if (matchPhase === "set3") {
      console.log('Skipping from set3 to final_break');
      setMatchPhase("final_break");
      setTimeLeft(60); // 60 seconds for final break
      setIsRunning(true);
      onComplete();
    } else {
      // For final_break phase, ensure we go to complete, not results directly
      if (matchPhase === "final_break") {
        console.log('Skipping from final_break to complete');
        setMatchPhase("complete");
        setIsRunning(false);
        onComplete();
      } else {
        setTimeLeft(0);
        progressToNextPhase();
      }
    }
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
