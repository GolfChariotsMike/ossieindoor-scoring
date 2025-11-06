
import { useState, useEffect, useRef } from "react";
import { MatchPhase } from "./types";

interface UseTimerProps {
  initialMinutes: number;
  breakDurationSeconds?: number;
  onComplete: () => void;
  onSwitchTeams: () => void;
  isBreak: boolean;
  isMatchComplete: boolean;
  fixture?: { Id: string };
}

export const useTimer = ({ 
  initialMinutes, 
  breakDurationSeconds = 60,
  onComplete, 
  onSwitchTeams,
  isBreak,
  isMatchComplete,
  fixture 
}: UseTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [matchPhase, setMatchPhase] = useState<MatchPhase>("not_started");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPhaseChangingRef = useRef(false);

  // Phase progression
  const progressToNextPhase = () => {
    if (isPhaseChangingRef.current) {
      console.log("Phase change already in progress, ignoring redundant call");
      return;
    }

    isPhaseChangingRef.current = true;
    
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
        let phaseTime;
        if (nextPhase.includes('break')) {
          phaseTime = breakDurationSeconds; // Use configurable break duration
          console.log(`Setting break time to ${phaseTime} seconds for phase ${nextPhase}`);
        } else {
          phaseTime = initialMinutes * 60; // Regular set time
          console.log(`Setting set time to ${phaseTime} seconds for phase ${nextPhase}`);
        }
        
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

    // Reset the flag after a short delay to prevent multiple rapid transitions
    setTimeout(() => {
      isPhaseChangingRef.current = false;
    }, 100);
  };

  // Handle fixture initialization (only run once when fixture first becomes available)
  useEffect(() => {
    if (fixture?.Id && matchPhase === "not_started") {
      console.log('Initializing timer for fixture:', fixture.Id);
      setMatchPhase("set1");
      setTimeLeft(initialMinutes * 60);
      setIsRunning(true);
    }
  }, [fixture?.Id, initialMinutes, matchPhase]);

  // Timer logic
  useEffect(() => {
    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isRunning && timeLeft > 0 && !isMatchComplete) {
      console.log(`Timer running with ${timeLeft} seconds left in phase ${matchPhase}`);
      
      intervalRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          // If time is up, clear interval and progress to next phase
          if (prevTime <= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            
            console.log(`Timer reached zero for phase ${matchPhase}`);
            
            // Set timeout to ensure this happens after state update but in the right order
            setTimeout(() => {
              if (!isPhaseChangingRef.current) {
                progressToNextPhase();
              }
            }, 0);
            
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (isRunning && timeLeft === 0 && !isMatchComplete && !isPhaseChangingRef.current) {
      // Fix for timer getting stuck at 00:00 - force progression if timer is running but at zero
      console.log(`Timer is at zero but still running in phase ${matchPhase}, forcing progression`);
      progressToNextPhase();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, timeLeft, isMatchComplete, matchPhase]);

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
    // Immediately clear any running interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setTimeLeft(0);
    // Ensure we're not already in a phase transition
    if (!isPhaseChangingRef.current) {
      progressToNextPhase();
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
