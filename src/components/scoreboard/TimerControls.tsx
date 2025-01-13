import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, ArrowLeftRight } from "lucide-react";
import { useState } from "react";

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
  const [isRunning, setIsRunning] = useState(false);

  const handleStartStop = () => {
    setIsRunning(!isRunning);
    onStartStop();
  };

  return (
    <div className="flex justify-center gap-4 mt-4">
      <Button
        variant="outline"
        size="lg"
        onClick={handleStartStop}
        disabled={isMatchComplete}
        className="bg-volleyball-black text-[#FFFFFF] hover:bg-volleyball-black/90 border-[#FFFFFF] disabled:opacity-50"
      >
        {isRunning ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
      </Button>
      <Button
        variant="outline"
        size="lg"
        onClick={onReset}
        disabled={isMatchComplete}
        className="bg-volleyball-black text-[#FFFFFF] hover:bg-volleyball-black/90 border-[#FFFFFF] disabled:opacity-50"
      >
        <RotateCcw className="h-6 w-6" />
      </Button>
      <Button
        variant="outline"
        size="lg"
        onClick={onSwitchTeams}
        disabled={isMatchComplete}
        className="bg-volleyball-black text-[#FFFFFF] hover:bg-volleyball-black/90 border-[#FFFFFF] disabled:opacity-50"
      >
        <ArrowLeftRight className="h-6 w-6" />
      </Button>
    </div>
  );
};