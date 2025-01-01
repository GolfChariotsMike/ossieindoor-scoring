interface TeamScoreProps {
  teamName: string;
  score: number;
  onScoreUpdate: () => void;
}

export const TeamScore = ({ teamName, score, onScoreUpdate }: TeamScoreProps) => {
  const getTextSizeClass = (name: string) => {
    if (name.length <= 10) return 'text-6xl';
    if (name.length <= 15) return 'text-5xl';
    if (name.length <= 20) return 'text-4xl';
    return 'text-3xl';
  };

  return (
    <div className="text-center flex flex-col items-center">
      <div className={`font-display text-volleyball-cream uppercase tracking-[0.2em] mb-8 w-[400px] h-24 flex items-center justify-center [text-shadow:_2px_2px_0_rgb(0_0_0)] ${getTextSizeClass(teamName)}`}>
        {teamName}
      </div>
      <div className="relative">
        <button
          className="w-full max-w-[400px] aspect-square text-[14rem] bg-volleyball-black hover:bg-volleyball-black/90 
          text-volleyball-cream font-score rounded-3xl mb-2"
          onClick={onScoreUpdate}
        >
          {score}
        </button>
        <button
          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-volleyball-black hover:bg-volleyball-black/90 
          text-volleyball-cream font-score rounded-xl px-4 py-2 text-xl border-2 border-volleyball-cream"
          onClick={(e) => {
            e.stopPropagation();
            if (score > 0) {
              onScoreUpdate();
            }
          }}
        >
          -1
        </button>
      </div>
    </div>
  );
};