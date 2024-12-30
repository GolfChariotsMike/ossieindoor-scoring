import { Button } from "@/components/ui/button";
import { ArrowLeftRight } from "lucide-react";

interface ScoreboardControlsProps {
  onSwitchTeams: () => void;
}

export const ScoreboardControls = ({ onSwitchTeams }: ScoreboardControlsProps) => {
  return (
    <Button
      variant="outline"
      onClick={onSwitchTeams}
      className="bg-volleyball-lightBlue hover:bg-volleyball-gold"
    >
      <ArrowLeftRight className="mr-2 h-4 w-4" />
      Swap Sides
    </Button>
  );
};