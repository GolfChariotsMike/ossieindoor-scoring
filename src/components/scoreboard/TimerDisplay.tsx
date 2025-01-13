import { cn } from "@/lib/utils";

interface TimerDisplayProps {
  minutes: number;
  seconds: number;
  isBreak: boolean;
  isMatchComplete: boolean;
}

export const TimerDisplay = ({ minutes, seconds, isBreak, isMatchComplete }: TimerDisplayProps) => {
  return (
    <div 
      className={cn(
        "font-score text-[12rem] tracking-[0.2em] leading-none mb-2",
        isBreak 
          ? "text-volleyball-black [text-shadow:_2px_2px_0_#fff,_-2px_-2px_0_#fff,_2px_-2px_0_#fff,_-2px_2px_0_#fff]" 
          : "text-white [text-shadow:_4px_4px_0_rgb(0_0_0)]"
      )}
    >
      {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
    </div>
  );
};