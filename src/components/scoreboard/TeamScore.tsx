interface TeamScoreProps {
  teamName: string;
  score: number;
  onScoreUpdate: () => void;
}

export const TeamScore = ({ teamName, score, onScoreUpdate }: TeamScoreProps) => {
  return (
    <div className="text-center w-full">
      <div className="text-volleyball-cream text-6xl mb-8 uppercase tracking-[0.2em] font-bold">
        {teamName}
      </div>
      <button
        className="w-full aspect-square text-[12rem] bg-volleyball-black hover:bg-volleyball-black/90 
        text-volleyball-cream font-mono tracking-wider rounded-3xl border-none"
        onClick={onScoreUpdate}
      >
        {score}
      </button>
    </div>
  );
};