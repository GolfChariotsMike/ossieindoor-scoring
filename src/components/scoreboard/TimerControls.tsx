import { Button } from "@/components/ui/button";
import { Play, RotateCcw, ArrowLeftRight } from "lucide-react";

interface TimerControlsProps {
  isMatchComplete: boolean;
  onStartStop: () => void;
  onReset: () => void;
  onSwitchTeams: () => void;
}

export const TimerControls = ({ 
  isMatchComplete, 
  onStartStop, 
  onReset, 
  onSwitchTeams 
}: TimerControlsProps) => {
  return (
    <div className="flex justify-center gap-4 mb-1">
      <Button
        variant="outline"
        size="icon"
        onClick={onStartStop}
        disabled={isMatchComplete}
        className="bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90 border-volleyball-cream disabled:opacity-50"
      >
        <Play />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={onReset}
        disabled={isMatchComplete}
        className="bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90 border-volleyball-cream disabled:opacity-50"
      >
        <RotateCcw />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={onSwitchTeams}
        disabled={isMatchComplete}
        className="bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90 border-volleyball-cream disabled:opacity-50"
      >
        <ArrowLeftRight />
      </Button>
    </div>
  );
};