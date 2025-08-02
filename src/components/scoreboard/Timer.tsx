import { TimerDisplay } from "./TimerDisplay";
import { TimerControls } from "./TimerControls";
import { Button } from "@/components/ui/button";
import { FastForward } from "lucide-react";
import { useTimer } from "./timer/useTimer";
import { Fixture } from "@/types/volleyball";
import { useState, useRef } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

interface TimerProps {
  initialMinutes: number;
  onComplete: () => void;
  onSwitchTeams: () => void;
  isBreak: boolean;
  isMatchComplete: boolean;
  fixture?: Fixture;
  onAceBlock: (team: "home" | "away", type: "ace" | "block") => void;
  isTeamsSwitched: boolean;
}

export const Timer = ({ 
  initialMinutes = 14,
  onComplete, 
  onSwitchTeams,
  isBreak,
  isMatchComplete,
  fixture,
  onAceBlock,
  isTeamsSwitched
}: TimerProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLongPress, setIsLongPress] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();
  const longPressDelay = 3000; // Changed from 5000 to 3000 (3 seconds)

  const {
    timeLeft,
    handleStartStop,
    handleReset,
    handleSkipPhase,
    progressToNextPhase
  } = useTimer({
    initialMinutes,
    onComplete: () => {
      console.log('Timer complete or skipped with fixture:', fixture);
      // Notify user of phase change
      toast({
        title: isBreak ? "Set starting" : "Break starting",
        description: isBreak ? "Set timer has started" : "Break timer has started",
        duration: 3000,
      });
      onComplete();
    },
    onSwitchTeams,
    isBreak,
    isMatchComplete,
    fixture
  });

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleSkip = () => {
    handleSkipPhase();
    toast({
      title: "Phase skipped",
      description: "Moving to next phase",
      duration: 3000,
    });
    setDialogOpen(false);
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    console.log('Touch start');
    timerRef.current = setTimeout(() => {
      console.log('Long press detected');
      setIsLongPress(true);
      setDialogOpen(true);
    }, longPressDelay);
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    console.log('Touch end, isLongPress:', isLongPress);
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    setIsLongPress(false);
  };

  const handleTouchCancel = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    console.log('Touch cancelled');
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsLongPress(false);
  };

  return (
    <div className="text-center relative">
      <div className="absolute top-0 right-0">
        <Button
          variant="outline"
          size="sm"
          disabled={isMatchComplete}
          className={`bg-volleyball-black text-[#FFFFFF] hover:bg-volleyball-black/90 border-[#FFFFFF] disabled:opacity-50 
            ${isLongPress ? 'bg-volleyball-black/70' : 'bg-volleyball-black'}`}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
          onMouseDown={handleTouchStart}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchCancel}
        >
          <FastForward className="w-4 h-4 mr-1" />
          Skip Phase
        </Button>

        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to skip this phase?</AlertDialogTitle>
              <AlertDialogDescription>
                This action should only be used if something has gone wrong with the timer or match flow. 
                Skipping a phase cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSkip}>Skip Phase</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
        onAceBlock={onAceBlock}
        isTeamsSwitched={isTeamsSwitched}
      />
    </div>
  );
};
