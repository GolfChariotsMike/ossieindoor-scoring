import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  onClick: () => void;
}

export const BackButton = ({ onClick }: BackButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="absolute top-6 left-6 z-10 bg-volleyball-black hover:bg-volleyball-black/90 text-volleyball-cream"
    >
      <ArrowLeft className="h-6 w-6" />
    </Button>
  );
};