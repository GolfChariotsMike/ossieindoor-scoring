import { TimerDisplay } from "./TimerDisplay";
import { TimerControls } from "./TimerControls";
import { useTimer } from "./timer/useTimer";
import { Fixture } from "@/types/volleyball";
import { toast } from "@/hooks/use-toast";

interface TimerProps {
  initialMinutes: number;
  breakDurationSeconds?: number;
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
  breakDurationSeconds = 60,
  onComplete, 
  onSwitchTeams,
  isBreak,
  isMatchComplete,
  fixture,
  onAceBlock,
  isTeamsSwitched
}: TimerProps) => {
  const {
    timeLeft,
    matchPhase,
    handleStartStop,
    handleReset,
    handleSkipPhase,
    progressToNextPhase
  } = useTimer({
    initialMinutes,
    breakDurationSeconds,
    onComplete: () => {
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

  return (
    <div className="text-center relative">
      <TimerDisplay 
        minutes={minutes}
        seconds={seconds}
        isBreak={isBreak || matchPhase === "not_started"}
        isMatchComplete={isMatchComplete}
        label={matchPhase === "not_started" ? "Game starts in" : undefined}
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
