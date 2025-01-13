import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, ArrowLeftRight } from "lucide-react";

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
  onSwitchTeams,
}: TimerControlsProps) => {
  return (
    <div className="flex justify-center gap-4">
      <Button
        variant="outline"
        size="lg"
        onClick={onStartStop}
        disabled={isMatchComplete}
        className="bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90 border-volleyball-cream disabled:opacity-50"
      >
        <Play className="w-6 h-6" />
        <Pause className="w-6 h-6" />
      </Button>
      <Button
        variant="outline"
        size="lg"
        onClick={onReset}
        disabled={isMatchComplete}
        className="bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90 border-volleyball-cream disabled:opacity-50"
      >
        <RotateCcw className="w-6 h-6" />
      </Button>
      <Button
        variant="outline"
        size="lg"
        onClick={onSwitchTeams}
        disabled={isMatchComplete}
        className="bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90 border-volleyball-cream disabled:opacity-50"
      >
        <ArrowLeftRight className="w-6 h-6" />
      </Button>
    </div>
  );
};