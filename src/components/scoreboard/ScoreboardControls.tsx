
import { Button } from "@/components/ui/button";
import { ArrowLeftRight } from "lucide-react";
import { Fixture } from "@/types/volleyball";

interface ScoreboardControlsProps {
  onSwitchTeams?: () => void;
  isBreak?: boolean;
  isMatchComplete?: boolean;
  fixture?: Fixture;
}

export const ScoreboardControls = ({ 
  onSwitchTeams,
  isBreak, 
  isMatchComplete,
  fixture
}: ScoreboardControlsProps) => {
  return (
    <Button
      variant="outline"
      onClick={onSwitchTeams}
      disabled={isBreak || isMatchComplete}
      className="bg-volleyball-lightBlue hover:bg-volleyball-gold disabled:opacity-50"
    >
      <ArrowLeftRight className="mr-2 h-4 w-4" />
      Swap Sides
    </Button>
  );
};
