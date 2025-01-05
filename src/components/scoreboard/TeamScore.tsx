import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface TeamScoreProps {
  teamName: string;
  score: number;
  onScoreUpdate: (increment: boolean) => void;
  onStatUpdate: (type: "block" | "ace") => void;
}

export const TeamScore = ({ teamName, score, onScoreUpdate, onStatUpdate }: TeamScoreProps) => {
  const [isLongPress, setIsLongPress] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();
  const decrementIntervalRef = useRef<NodeJS.Timeout>();
  const longPressDelay = 500;

  const getTextSizeClass = (name: string) => {
    if (name.length <= 10) return 'text-7xl';
    if (name.length <= 15) return 'text-6xl';
    if (name.length <= 20) return 'text-5xl';
    return 'text-4xl';
  };

  const startDecrementInterval = () => {
    if (decrementIntervalRef.current) {
      clearInterval(decrementIntervalRef.current);
    }
    
    decrementIntervalRef.current = setInterval(() => {
      if (score > 0) {
        onScoreUpdate(false);
      }
    }, 150);
  };

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    console.log('Touch start');
    timerRef.current = setTimeout(() => {
      console.log('Long press detected');
      setIsLongPress(true);
      onScoreUpdate(false);
      startDecrementInterval();
    }, longPressDelay);
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    console.log('Touch end, isLongPress:', isLongPress);
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (decrementIntervalRef.current) {
      clearInterval(decrementIntervalRef.current);
    }
    
    if (!isLongPress) {
      console.log('Short press - incrementing score');
      onScoreUpdate(true);
    }
    
    setIsLongPress(false);
  };

  const handleTouchCancel = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    console.log('Touch cancelled');
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (decrementIntervalRef.current) {
      clearInterval(decrementIntervalRef.current);
    }
    setIsLongPress(false);
  };

  return (
    <div className="text-center flex flex-col items-center">
      <div className={`font-display text-white uppercase tracking-[0.2em] mb-8 w-[450px] h-24 flex items-center justify-center [text-shadow:_4px_4px_0_rgb(0_0_0)] ${getTextSizeClass(teamName)}`}>
        {teamName}
      </div>
      <div className="flex gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onStatUpdate("block")}
          className="h-10 w-32 bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90 border-volleyball-cream"
        >
          <Plus className="h-4 w-4 mr-2" />
          Block
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onStatUpdate("ace")}
          className="h-10 w-32 bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90 border-volleyball-cream"
        >
          <Plus className="h-4 w-4 mr-2" />
          ACE
        </Button>
      </div>
      <button
        className={`w-[450px] h-[400px] text-[16rem] ${isLongPress ? 'bg-volleyball-black/70' : 'bg-volleyball-black'} 
        text-white font-score rounded-3xl mb-8 select-none touch-none transition-colors`}
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