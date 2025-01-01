import { useState, useRef } from "react";

interface TeamScoreProps {
  teamName: string;
  score: number;
  onScoreUpdate: (increment: boolean) => void;
}

export const TeamScore = ({ teamName, score, onScoreUpdate }: TeamScoreProps) => {
  const [isLongPress, setIsLongPress] = useState(false);
  const timerRef = useRef<number>();
  const longPressDelay = 500; // 500ms for long press detection

  const getTextSizeClass = (name: string) => {
    if (name.length <= 10) return 'text-6xl';
    if (name.length <= 15) return 'text-5xl';
    if (name.length <= 20) return 'text-4xl';
    return 'text-3xl';
  };

  const handleTouchStart = () => {
    timerRef.current = window.setTimeout(() => {
      setIsLongPress(true);
      onScoreUpdate(false); // Decrement score
    }, longPressDelay);
  };

  const handleTouchEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (!isLongPress) {
      onScoreUpdate(true); // Increment score
    }
    setIsLongPress(false);
  };

  const handleTouchCancel = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setIsLongPress(false);
  };

  return (
    <div className="text-center flex flex-col items-center">
      <div className={`font-display text-volleyball-cream uppercase tracking-[0.2em] mb-8 w-[400px] h-24 flex items-center justify-center [text-shadow:_2px_2px_0_rgb(0_0_0)] ${getTextSizeClass(teamName)}`}>
        {teamName}
      </div>
      <button
        className={`w-full max-w-[400px] aspect-square text-[14rem] bg-volleyball-black hover:bg-volleyball-black/90 
        text-volleyball-cream font-score rounded-3xl mb-8 select-none touch-none ${isLongPress ? 'bg-volleyball-black/80' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchCancel}
      >
        {score}
      </button>
    </div>
  );
};