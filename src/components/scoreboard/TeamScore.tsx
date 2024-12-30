import { Button } from "@/components/ui/button";

interface TeamScoreProps {
  teamName: string;
  score: number;
  onScoreUpdate: () => void;
}

export const TeamScore = ({ teamName, score, onScoreUpdate }: TeamScoreProps) => {
  return (
    <div className="text-center">
      <div className="text-white text-xl mb-2">{teamName}</div>
      <Button
        className="w-full h-20 text-3xl bg-volleyball-lightBlue hover:bg-volleyball-gold transition-colors"
        onClick={onScoreUpdate}
      >
        {score}
      </Button>
    </div>
  );
};