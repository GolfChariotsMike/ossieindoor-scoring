
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

  // Phase progression - ensuring ordered flow
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

  // Enhanced handling for end of sets to enforce proper phase flow
  useEffect(() => {
    if (timeLeft === 0 && matchPhase.includes('set')) {
      const currentSetNumber = parseInt(matchPhase.charAt(3));
      
      if (currentSetNumber === 3) {
        console.log('Set 3 ended, ensuring transition to final_break');
        setMatchPhase('final_break');
        setTimeLeft(60); // 60 seconds for final break
        setIsRunning(true);
        onComplete();
      } else if (currentSetNumber >= 1 && currentSetNumber <= 2) {
        const nextPhase = `break${currentSetNumber}` as MatchPhase;
        console.log(`Set ${currentSetNumber} ended, moving to ${nextPhase}`);
        setMatchPhase(nextPhase);
        setTimeLeft(60); // Set all breaks to 60 seconds
        setIsRunning(true);
        onComplete();
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

  // Modified handleSkipPhase to enforce phase progression
  const handleSkipPhase = () => {
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
    
    // Ensure we never skip the final_break phase
    if (matchPhase === "set3") {
      console.log('Skipping from set3 to final_break');
      setMatchPhase("final_break");
      setTimeLeft(60); // 60 seconds for final break
      setIsRunning(true);
      onComplete();
    }
    // Ensure correct progression from final_break to complete
    else if (matchPhase === "final_break") {
      console.log('Skipping from final_break to complete');
      setMatchPhase("complete");
      setIsRunning(false);
      onComplete();
    }
    // Normal phase transition
    else if (nextPhase) {
      console.log(`Skipping from ${matchPhase} to ${nextPhase}`);
      
      if (nextPhase === 'complete') {
        setMatchPhase("complete");
        setIsRunning(false);
        onComplete();
      } else {
        // Skip to the next phase with appropriate time
        const phaseTime = nextPhase.includes('break') ? 60 : initialMinutes * 60;
        setTimeLeft(phaseTime);
        setMatchPhase(nextPhase);
        setIsRunning(true);
        onComplete();
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
