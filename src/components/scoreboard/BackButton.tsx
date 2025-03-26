
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  onClick: () => void;
  className?: string;
}

export const BackButton = ({ onClick, className = "" }: BackButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={`absolute top-6 left-6 z-10 bg-volleyball-black hover:bg-volleyball-black/90 text-volleyball-cream ${className}`}
    >
      <ArrowLeft className="h-6 w-6" />
    </Button>
  );
};
