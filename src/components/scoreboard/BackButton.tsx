import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  onClick: () => void;
}

export const BackButton = ({ onClick }: BackButtonProps) => {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onClick}
      className="absolute left-8 top-8 bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90 border-volleyball-cream"
    >
      <ArrowLeft />
    </Button>
  );
};