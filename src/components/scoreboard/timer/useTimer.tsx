
import { useState, useEffect, useRef } from "react";
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
  const phaseTransitionCompleted = useRef<boolean>(false);

  // Define the ordered phases for consistent progression
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

  // Phase progression - ensuring ordered flow
  const progressToNextPhase = () => {
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
        if (currentIndex > 0) { // Don't call for the initial transition to set1
          onComplete();
        }
      }
      
      setMatchPhase(nextPhase);
      // Reset the transition flag
      phaseTransitionCompleted.current = false;
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
            
            // Instead of directly calling progressToNextPhase,
            // set the time to 0 to let the phase transition effect handle it
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

  // Phase transition logic - unified approach for all phase transitions
  useEffect(() => {
    // Only trigger the transition if the timer has reached 0 and we haven't already processed
    // a transition for this phase
    if (timeLeft === 0 && isRunning && !phaseTransitionCompleted.current) {
      phaseTransitionCompleted.current = true;
      console.log(`Timer reached 0 for phase ${matchPhase}, transitioning to next phase`);
      
      const currentIndex = phases.indexOf(matchPhase);
      const nextPhase = phases[currentIndex + 1];
      
      // Safety check to make sure we have a valid next phase
      if (nextPhase) {
        console.log(`Auto-transitioning from ${matchPhase} to ${nextPhase}`);
        
        if (nextPhase === 'complete') {
          setIsRunning(false);
          onComplete();
        } else {
          // Set appropriate time for different phases
          const phaseTime = nextPhase.includes('break') ? 60 : initialMinutes * 60;
          setTimeLeft(phaseTime);
          setIsRunning(true);
          onComplete();
        }
        
        setMatchPhase(nextPhase);
      }
    }
  }, [timeLeft, isRunning, matchPhase, onComplete, initialMinutes]);

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

  // Enforce strict phase-by-phase progression
  const handleSkipPhase = () => {
    const currentIndex = phases.indexOf(matchPhase);
    const nextPhase = phases[currentIndex + 1];
    
    if (!nextPhase) return; // Safety check
    
    console.log(`Skipping from ${matchPhase} to ${nextPhase}`);
    
    // Handle all phase transitions consistently 
    if (nextPhase === 'complete') {
      setMatchPhase(nextPhase);
      setIsRunning(false);
      onComplete();
    } else {
      // All other phases - set appropriate time and transition
      const phaseTime = nextPhase.includes('break') ? 60 : initialMinutes * 60;
      setTimeLeft(phaseTime);
      setMatchPhase(nextPhase);
      setIsRunning(true);
      onComplete();
    }
    
    // Reset the transition flag for the new phase
    phaseTransitionCompleted.current = false;
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
