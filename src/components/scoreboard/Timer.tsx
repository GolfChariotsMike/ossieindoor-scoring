import { TimerDisplay } from "./TimerDisplay";
import { TimerControls } from "./TimerControls";
import { Button } from "@/components/ui/button";
import { FastForward } from "lucide-react";
import { TimerProps } from "./timer/types";
import { useTimer } from "./timer/useTimer";

export const Timer = ({ 
  initialMinutes, 
  onComplete, 
  onSwitchTeams,
  isBreak,
  isMatchComplete,
  fixture,
  onNextMatch
}: TimerProps) => {
  const {
    timeLeft,
    isRunning,
    matchPhase,
    resetTimer,
    setIsRunning,
    progressToNextPhase,
    progressToNextMatch
  } = useTimer(initialMinutes, onComplete, fixture, onNextMatch);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleStartStop = () => {
    console.log('Start/Stop clicked, current phase:', matchPhase);
    
    if (matchPhase === "not_started") {
      console.log('Starting first set');
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
    progressToNextPhase();
  };

  const handleNextMatch = () => {
    console.log('Manual next match clicked');
    progressToNextMatch();
  };

  return (
    <div className="text-volleyball-cream text-center relative">
      <div className="absolute top-0 right-0 space-x-2">
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
        {isMatchComplete && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMatch}
            className="bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90 border-volleyball-cream"
          >
            <FastForward className="w-4 h-4 mr-1" />
            Next Match
          </Button>
        )}
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