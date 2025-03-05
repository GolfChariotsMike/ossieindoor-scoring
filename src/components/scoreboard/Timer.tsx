
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
}

export const Timer = ({ 
  initialMinutes = 14,
  onComplete, 
  onSwitchTeams,
  isBreak,
  isMatchComplete,
  fixture
}: TimerProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLongPress, setIsLongPress] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();
  const longPressDelay = 5000; // 5 seconds
  const onCompleteRef = useRef<() => void>(onComplete);

  // Update ref when onComplete changes
  useRef(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const {
    timeLeft,
    handleStartStop,
    handleReset,
    handleSkipPhase,
    progressToNextPhase,
    matchPhase
  } = useTimer({
    initialMinutes,
    onComplete: () => {
      console.log('Timer complete or skipped with fixture:', fixture, 'Current phase:', matchPhase);
      
      // Different notifications based on phase
      if (matchPhase === "set3") {
        toast({
          title: "Final Break Starting",
          description: "1 minute break before match completion",
          duration: 3000,
        });
      } else if (matchPhase === "final_break") {
        toast({
          title: "Match Complete",
          description: "Final break has ended",
          duration: 3000,
        });
      } else if (matchPhase.includes("break")) {
        toast({
          title: "Set Starting",
          description: "Set timer has started",
          duration: 3000,
        });
      } else {
        toast({
          title: "Break Starting",
          description: "Break timer has started",
          duration: 3000,
        });
      }
      
      onCompleteRef.current();
    },
    onSwitchTeams,
    isBreak,
    isMatchComplete,
    fixture
  });

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleSkip = () => {
    console.log('Manually skipping phase:', matchPhase);
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

  // Debug indicator for current phase - can be removed in production
  const getPhaseLabel = () => {
    switch(matchPhase) {
      case "not_started": return "Not Started";
      case "set1": return "Set 1";
      case "break1": return "Break 1";
      case "set2": return "Set 2";
      case "break2": return "Break 2";
      case "set3": return "Set 3";
      case "final_break": return "Final Break";
      case "complete": return "Complete";
      default: return matchPhase;
    }
  };

  // Display notification about special phases
  const getPhaseDescription = () => {
    if (matchPhase === "final_break") {
      return "Final 1-minute break";
    }
    return "";
  };

  const phaseDescription = getPhaseDescription();

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
      
      {/* Phase indicator for debugging */}
      <div className="text-xs text-white absolute top-0 left-0 bg-black/50 px-2 py-1 rounded">
        {getPhaseLabel()}
      </div>
      
      {/* Phase description (for final break) */}
      {phaseDescription && (
        <div className="text-sm text-white absolute top-7 left-0 bg-black/50 px-2 py-1 rounded animate-pulse">
          {phaseDescription}
        </div>
      )}
      
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
