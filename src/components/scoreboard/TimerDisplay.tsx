import { cn } from "@/lib/utils";

interface TimerDisplayProps {
  minutes: number;
  seconds: number;
  isBreak: boolean;
  isMatchComplete: boolean;
}

export const TimerDisplay = ({ minutes, seconds, isBreak, isMatchComplete }: TimerDisplayProps) => {
  const timerClassName = isBreak 
    ? "text-black [text-shadow:_2px_2px_0_rgb(255,255,255),_-2px_-2px_0_rgb(255,255,255),_2px_-2px_0_rgb(255,255,255),_-2px_2px_0_rgb(255,255,255)]"
    : "text-white [text-shadow:_2px_2px_0_rgb(0,0,0),_-2px_-2px_0_rgb(0,0,0),_2px_-2px_0_rgb(0,0,0),_-2px_2px_0_rgb(0,0,0)]";

  return (
    <div className={cn(
      "font-score text-[12rem] tracking-[0.2em] leading-none mb-2",
      timerClassName,
      isMatchComplete && "opacity-50"
    )}>
      {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
    </div>
  );
};