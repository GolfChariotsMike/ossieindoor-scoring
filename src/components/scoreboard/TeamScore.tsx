interface TeamScoreProps {
  teamName: string;
  score: number;
  onScoreUpdate: () => void;
}

export const TeamScore = ({ teamName, score, onScoreUpdate }: TeamScoreProps) => {
  // Calculate text size class based on team name length
  const getTextSizeClass = (name: string) => {
    if (name.length <= 10) return 'text-6xl';
    if (name.length <= 15) return 'text-5xl';
    if (name.length <= 20) return 'text-4xl';
    return 'text-3xl';
  };

  return (
    <div className="text-center flex flex-col items-center">
      <div className={`text-volleyball-cream uppercase tracking-[0.2em] mb-8 w-[400px] h-24 flex items-center justify-center ${getTextSizeClass(teamName)}`}>
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