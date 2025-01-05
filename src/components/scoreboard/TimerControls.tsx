import { Button } from "@/components/ui/button";
import { Play, RotateCcw, ArrowLeftRight, Plus } from "lucide-react";

interface TimerControlsProps {
  isMatchComplete: boolean;
  onStartStop: () => void;
  onReset: () => void;
  onSwitchTeams: () => void;
  onRecordStat?: (team: 'home' | 'away', type: 'block' | 'ace') => void;
}

export const TimerControls = ({ 
  isMatchComplete, 
  onStartStop, 
  onReset, 
  onSwitchTeams,
  onRecordStat 
}: TimerControlsProps) => {
  return (
    <div className="flex justify-center gap-4 mb-1 relative">
      {/* Left team controls */}
      <div className="absolute -translate-x-[250px] flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onRecordStat?.('home', 'block')}
          disabled={isMatchComplete}
          className="bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90 border-volleyball-cream disabled:opacity-50"
        >
          <Plus className="mr-1" />B
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onRecordStat?.('home', 'ace')}
          disabled={isMatchComplete}
          className="bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90 border-volleyball-cream disabled:opacity-50"
        >
          <Plus className="mr-1" />A
        </Button>
      </div>

      {/* Center timer controls */}
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

      {/* Right team controls */}
      <div className="absolute translate-x-[250px] flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onRecordStat?.('away', 'block')}
          disabled={isMatchComplete}
          className="bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90 border-volleyball-cream disabled:opacity-50"
        >
          <Plus className="mr-1" />B
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onRecordStat?.('away', 'ace')}
          disabled={isMatchComplete}
          className="bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90 border-volleyball-cream disabled:opacity-50"
        >
          <Plus className="mr-1" />A
        </Button>
      </div>
    </div>
  );
};