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
          ? "text-[#000000] [text-shadow:_4px_4px_0_rgb(255_255_255),_-4px_-4px_0_rgb(255_255_255),_4px_-4px_0_rgb(255_255_255),_-4px_4px_0_rgb(255_255_255)]" 
          : "text-[#FFFFFF] [text-shadow:_4px_4px_0_rgb(0_0_0),_-4px_-4px_0_rgb(0_0_0),_4px_-4px_0_rgb(0_0_0),_-4px_4px_0_rgb(0_0_0)]"
      )}
    >
      {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
    </div>
  );
};