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
        "font-score text-[12rem] tracking-[0.2em] leading-none mb-2 [text-shadow:_2px_2px_0_rgb(0_0_0)]",
        isBreak ? 'text-blue-400' : 'text-white'
      )}
    >
      {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
    </div>
  );
};