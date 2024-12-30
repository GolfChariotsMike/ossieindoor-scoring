interface TeamScoreProps {
  teamName: string;
  score: number;
  onScoreUpdate: () => void;
}

export const TeamScore = ({ teamName, score, onScoreUpdate }: TeamScoreProps) => {
  return (
    <div className="text-center flex flex-col items-center">
      <div className="text-volleyball-cream text-6xl uppercase tracking-[0.2em] mb-8">
        {teamName}
      </div>
      <button
        className="w-[400px] aspect-square text-[12rem] bg-volleyball-black hover:bg-volleyball-black/90 
        text-volleyball-cream font-mono rounded-3xl"
        onClick={onScoreUpdate}
      >
        {score}
      </button>
    </div>
  );
};