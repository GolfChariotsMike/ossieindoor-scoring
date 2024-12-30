import { Button } from "@/components/ui/button";

interface TeamScoreProps {
  teamName: string;
  score: number;
  onScoreUpdate: () => void;
}

export const TeamScore = ({ teamName, score, onScoreUpdate }: TeamScoreProps) => {
  return (
    <div className="text-center">
      <div className="text-white text-2xl mb-3 font-bold">{teamName}</div>
      <Button
        className="w-full h-32 text-7xl bg-volleyball-lightBlue hover:bg-volleyball-gold transition-colors"
        onClick={onScoreUpdate}
      >
        {score}
      </Button>
    </div>
  );
};