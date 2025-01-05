import { Button } from "@/components/ui/button";
import { Shield, Award } from "lucide-react";

interface TeamControlsProps {
  team: "home" | "away";
  onBlock: () => void;
  onAce: () => void;
}

export const TeamControls = ({ team, onBlock, onAce }: TeamControlsProps) => {
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={onBlock}
        className="bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90 border-volleyball-cream h-9 w-9"
      >
        <Shield className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={onAce}
        className="bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90 border-volleyball-cream h-9 w-9"
      >
        <Award className="h-4 w-4" />
      </Button>
    </div>
  );
};