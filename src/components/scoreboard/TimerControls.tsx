import { Button } from "@/components/ui/button";
import { ArrowLeftRight } from "lucide-react";

interface TimerControlsProps {
  isMatchComplete: boolean;
  onStartStop: () => void;
  onReset: () => void;
  onSwitchTeams: () => void;
  onAceBlock: (team: "home" | "away", type: "ace" | "block") => void;
  isTeamsSwitched: boolean;
}

export const TimerControls = ({
  isMatchComplete,
  onStartStop,
  onReset,
  onSwitchTeams,
  onAceBlock,
  isTeamsSwitched,
}: TimerControlsProps) => {
  return (
    <div className="flex justify-between items-center mt-4">
      {/* Left buttons */}
      <div className="flex gap-8">
        <Button
          variant="outline"
          size="lg"
          disabled={isMatchComplete}
          onClick={() => onAceBlock(isTeamsSwitched ? "away" : "home", "ace")}
          className="bg-volleyball-black text-[#FFFFFF] hover:bg-volleyball-black/90 border-[#FFFFFF] disabled:opacity-50"
        >
          <span className="transform rotate-180">ACE</span>
        </Button>
        <Button
          variant="outline"
          size="lg"
          disabled={isMatchComplete}
          onClick={() => onAceBlock(isTeamsSwitched ? "away" : "home", "block")}
          className="bg-volleyball-black text-[#FFFFFF] hover:bg-volleyball-black/90 border-[#FFFFFF] disabled:opacity-50"
        >
          <span className="transform rotate-180">BLOCK</span>
        </Button>
      </div>

      {/* Center — Switch Sides button (larger) */}
      <div className="flex">
        <Button
          variant="outline"
          onClick={onSwitchTeams}
          disabled={isMatchComplete}
          className="bg-volleyball-black text-[#FFFFFF] hover:bg-volleyball-black/90 border-[#FFFFFF] disabled:opacity-50 h-16 px-10 text-lg"
        >
          <span className="transform rotate-180 flex items-center gap-2">
            <ArrowLeftRight className="h-8 w-8" />
            Switch Sides
          </span>
        </Button>
      </div>

      {/* Right buttons */}
      <div className="flex gap-8">
        <Button
          variant="outline"
          size="lg"
          disabled={isMatchComplete}
          onClick={() => onAceBlock(isTeamsSwitched ? "home" : "away", "ace")}
          className="bg-volleyball-black text-[#FFFFFF] hover:bg-volleyball-black/90 border-[#FFFFFF] disabled:opacity-50"
        >
          <span className="transform rotate-180">ACE</span>
        </Button>
        <Button
          variant="outline"
          size="lg"
          disabled={isMatchComplete}
          onClick={() => onAceBlock(isTeamsSwitched ? "home" : "away", "block")}
          className="bg-volleyball-black text-[#FFFFFF] hover:bg-volleyball-black/90 border-[#FFFFFF] disabled:opacity-50"
        >
          <span className="transform rotate-180">BLOCK</span>
        </Button>
      </div>
    </div>
  );
};