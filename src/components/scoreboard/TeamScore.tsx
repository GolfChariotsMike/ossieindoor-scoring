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
        className="w-full h-48 text-[8rem] bg-volleyball-lightBlue hover:bg-volleyball-gold transition-colors font-mono tracking-wider border-4 border-volleyball-gold shadow-lg"
        onClick={onScoreUpdate}
      >
        {score}
      </Button>
    </div>
  );
};