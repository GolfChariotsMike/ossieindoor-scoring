import { useState, useEffect } from "react";
import { TimerDisplay } from "./TimerDisplay";
import { TimerControls } from "./TimerControls";
import { Button } from "@/components/ui/button";
import { FastForward } from "lucide-react";

interface TimerProps {
  initialMinutes: number;
  onComplete: () => void;
  onSwitchTeams: () => void;
  isBreak: boolean;
  isMatchComplete: boolean;
  fixture?: { Id: string };
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
  isMatchComplete,
  fixture
}: TimerProps) => {
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
        console.log('Match complete');
        onComplete(); // Notify parent match is complete
        setIsRunning(false);
        setMatchPhase(nextPhase);
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
      
      if (currentSetNumber >= 1 && currentSetNumber <= 3 && timeLeft === 0) {
        if (currentSetNumber === 3) {
          console.log('Moving to final break from set 3');
          setMatchPhase('final_break');
          setTimeLeft(30); // 30 seconds final break
        } else {
          console.log('Moving to break', currentSetNumber);
          const breakPhase = `break${currentSetNumber}` as MatchPhase;
          setMatchPhase(breakPhase);
          setTimeLeft(60); // 1 minute regular break
        }
        setIsRunning(true);
      }
    }
  }, [isBreak, matchPhase, timeLeft]);

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
      resetTimer();
    }
  };

  const handleSkipPhase = () => {
    console.log('Skipping current phase:', matchPhase);
    setTimeLeft(0);
    progressToNextPhase();
  };

  return (
    <div className="text-volleyball-cream text-center relative">
      <div className="absolute top-0 right-0">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSkipPhase}
          disabled={isMatchComplete || matchPhase === "complete"}
          className="bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90 border-volleyball-cream disabled:opacity-50"
        >
          <FastForward className="w-4 h-4 mr-1" />
          Skip Phase
        </Button>
      </div>
      
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