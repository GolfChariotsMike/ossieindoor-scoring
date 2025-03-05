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
  const currentPhaseTimeRef = useRef<number | null>(null);

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

  // Get the appropriate time for a phase
  const getPhaseTime = (phase: MatchPhase): number => {
    if (phase.includes('break')) {
      return 60; // 60 seconds for breaks
    }
    return initialMinutes * 60; // Regular time for sets
  };

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
        const phaseTime = getPhaseTime(nextPhase);
        
        setTimeLeft(phaseTime);
        currentPhaseTimeRef.current = phaseTime;
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
      currentPhaseTimeRef.current = initialMinutes * 60;
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

  // Phase transition logic - triggered ONLY when timer reaches 0
  useEffect(() => {
    // Only trigger the transition if the timer has reached 0, is running, and we haven't already processed
    // a transition for this phase
    if (timeLeft === 0 && isRunning && !phaseTransitionCompleted.current) {
      console.log(`Timer reached 0 for phase ${matchPhase}, handling phase transition`);
      phaseTransitionCompleted.current = true; // Prevent double transitions
      
      const currentIndex = phases.indexOf(matchPhase);
      const nextPhase = phases[currentIndex + 1];
      
      if (nextPhase) {
        console.log(`Auto-transitioning from ${matchPhase} to ${nextPhase}`);
        
        if (nextPhase === 'complete') {
          setIsRunning(false);
          onComplete();
        } else {
          // Set appropriate time for different phases
          const phaseTime = getPhaseTime(nextPhase);
          setTimeLeft(phaseTime);
          currentPhaseTimeRef.current = phaseTime;
          
          // Call onComplete for phase transition events
          onComplete();
          
          // Keep timer running for the next phase
          setIsRunning(true);
        }
        
        setMatchPhase(nextPhase);
      }
    }
  }, [timeLeft, isRunning, matchPhase, onComplete, initialMinutes]);

  const handleStartStop = () => {
    if (matchPhase === "not_started") {
      setMatchPhase("set1");
      setTimeLeft(initialMinutes * 60);
      currentPhaseTimeRef.current = initialMinutes * 60;
      setIsRunning(true);
    } else if (!isMatchComplete) {
      setIsRunning(!isRunning);
    }
  };

  const handleReset = () => {
    if (!isMatchComplete) {
      // Reset to the current phase's original time
      const phaseTime = currentPhaseTimeRef.current || getPhaseTime(matchPhase);
      setTimeLeft(phaseTime);
      setIsRunning(false);
    }
  };

  // Enforce strict phase-by-phase progression
  const handleSkipPhase = () => {
    if (isMatchComplete) return;
    
    const currentIndex = phases.indexOf(matchPhase);
    const nextPhase = phases[currentIndex + 1];
    
    if (!nextPhase) return; // Safety check
    
    console.log(`Skipping from ${matchPhase} to ${nextPhase}`);
    
    // For all phases, ensure we're moving to the NEXT phase only
    if (nextPhase === 'complete') {
      setMatchPhase(nextPhase);
      setIsRunning(false);
      onComplete();
    } else {
      // This is critical - we need to display each phase for the right amount of time
      const phaseTime = getPhaseTime(nextPhase);
      setTimeLeft(phaseTime);
      currentPhaseTimeRef.current = phaseTime;
      
      setMatchPhase(nextPhase);
      
      // Start the timer for this phase - especially important for breaks
      setIsRunning(true);
      
      // Notify of phase transition
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
