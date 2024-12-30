import { Button } from "@/components/ui/button";

interface TeamScoreProps {
  teamName: string;
  score: number;
  onScoreUpdate: () => void;
}

export const TeamScore = ({ teamName, score, onScoreUpdate }: TeamScoreProps) => {
  return (
    <div className="text-center w-full">
      <div className="text-volleyball-cream text-4xl mb-4 uppercase tracking-wider font-bold">
        {teamName}
      </div>
      <Button
        className="w-full aspect-square text-[12rem] bg-volleyball-black hover:bg-volleyball-black/90 
        text-volleyball-cream font-mono tracking-wider rounded-3xl border-none shadow-lg"
        onClick={onScoreUpdate}
      >
        {score}
      </Button>
    </div>
  );
};