import { cn } from "@/lib/utils";

interface TimerDisplayProps {
  minutes: number;
  seconds: number;
  isBreak: boolean;
  isMatchComplete: boolean;
  className?: string;
}

export const TimerDisplay = ({ minutes, seconds, isBreak, isMatchComplete, className }: TimerDisplayProps) => {
  return (
    <div 
      className={cn(
        "font-score text-[12rem] tracking-[0.2em] leading-none mb-2",
        className
      )}
    >
      {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
    </div>
  );
};