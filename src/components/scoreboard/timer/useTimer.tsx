import { useState, useEffect } from "react";
import { MatchPhase } from "./types";

export const useTimer = (
  initialMinutes: number,
  onComplete: () => void,
  fixture?: { Id: string },
  onNextMatch?: () => void
) => {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [matchPhase, setMatchPhase] = useState<MatchPhase>("not_started");

  // Initialize phase to "set1" when a new fixture is loaded
  useEffect(() => {
    if (fixture?.Id) {
      console.log('New fixture detected, initializing phase to set1');
      setMatchPhase("set1");
      setTimeLeft(initialMinutes * 60);
      setIsRunning(true);
    }
  }, [fixture?.Id, initialMinutes]);

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
        if (nextPhase !== 'set1') {
          onComplete(); // Notify parent break is over
        }
        setTimeLeft(initialMinutes * 60);
        setIsRunning(true);
        setMatchPhase(nextPhase);
      } else if (nextPhase.startsWith('break')) {
        console.log('Starting break:', nextPhase);
        onComplete(); // Notify parent set is over
        setTimeLeft(60); // 1 minute break
        setIsRunning(true);
        setMatchPhase(nextPhase);
      } else if (nextPhase === 'final_break') {
        console.log('Starting final break');
        onComplete(); // Notify parent set is over
        setTimeLeft(30); // 30 seconds final break
        setIsRunning(true);
        setMatchPhase(nextPhase);
      } else if (nextPhase === 'results_display') {
        console.log('Starting results display');
        onComplete(); // Notify parent final break is over
        setTimeLeft(30); // 30 seconds results display
        setIsRunning(true);
        setMatchPhase(nextPhase);
      } else if (nextPhase === 'complete') {
        console.log('Match complete, transitioning to next match');
        onComplete(); // Notify parent match is complete
        setMatchPhase(nextPhase);
        progressToNextMatch();
      }
    }
  };

  const progressToNextMatch = () => {
    console.log('Progressing to next match');
    if (onNextMatch) {
      onNextMatch();
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

  return {
    timeLeft,
    isRunning,
    matchPhase,
    resetTimer,
    setIsRunning,
    progressToNextPhase,
    progressToNextMatch,
    setMatchPhase
  };
};