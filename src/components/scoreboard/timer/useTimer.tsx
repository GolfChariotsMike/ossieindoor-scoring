
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
  const [phaseTransitioning, setPhaseTransitioning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
        let phaseTime;
        if (nextPhase.includes('break')) {
          phaseTime = 60; // 60 seconds for all breaks
          console.log(`Setting break time to ${phaseTime} seconds for phase ${nextPhase}`);
        } else if (nextPhase === 'results_display') {
          phaseTime = 50; // 50 seconds for results display
          console.log(`Setting results display time to ${phaseTime} seconds`);
        } else {
          phaseTime = initialMinutes * 60; // Regular set time
          console.log(`Setting set time to ${phaseTime} seconds for phase ${nextPhase}`);
        }
        
        setTimeLeft(phaseTime);
        setIsRunning(true);
        
        // Call onComplete when transitioning to a new set or break
        // This ensures consistent behavior with the skip function
        if (nextPhase.startsWith('set') || nextPhase.includes('break') || nextPhase === 'results_display') {
          if (currentIndex > 0) { // Don't call for the initial transition to set1
            onComplete();
          }
        }
      }
      
      setMatchPhase(nextPhase);
    }
    
    // Reset phase transition flag
    setPhaseTransitioning(false);
  };

  // Handle fixture
  useEffect(() => {
    if (fixture?.Id) {
      setMatchPhase("set1");
      setTimeLeft(initialMinutes * 60);
      setIsRunning(true);
      setPhaseTransitioning(false);
    }
  }, [fixture?.Id, initialMinutes]);

  // Timer logic - updated to be more synchronous and handle transitions like skip phase
  useEffect(() => {
    // Clean up any existing interval to avoid duplicates
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isRunning && timeLeft > 0 && !isMatchComplete && !phaseTransitioning) {
      console.log(`Timer running with ${timeLeft} seconds left in phase ${matchPhase}`);
      
      intervalRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          // When timer reaches 1 second or less
          if (prevTime <= 1) {
            console.log(`Timer expiring for phase ${matchPhase}`);
            
            // Clear interval immediately
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            
            // If we're not already transitioning
            if (!phaseTransitioning) {
              setPhaseTransitioning(true);
              // Use setTimeout to ensure state updates have propagated
              setTimeout(() => {
                setIsRunning(false);
                progressToNextPhase();
              }, 0);
            }
            
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } 
    // Handle case where timer is at zero but still running
    else if (isRunning && timeLeft === 0 && !isMatchComplete && !phaseTransitioning) {
      console.log(`Timer is at zero but still running in phase ${matchPhase}, forcing progression`);
      setPhaseTransitioning(true);
      setIsRunning(false);
      setTimeout(() => {
        progressToNextPhase();
      }, 0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, timeLeft, isMatchComplete, matchPhase, phaseTransitioning]);

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
    if (phaseTransitioning) return;
    
    setPhaseTransitioning(true);
    console.log(`Manually skipping phase ${matchPhase}`);
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setTimeLeft(0);
    setIsRunning(false);
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
