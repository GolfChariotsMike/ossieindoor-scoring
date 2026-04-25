import { cn } from "@/lib/utils";

interface TimerDisplayProps {
  minutes: number;
  seconds: number;
  isBreak: boolean;
  isMatchComplete: boolean;
  label?: string;
}

export const TimerDisplay = ({ minutes, seconds, isBreak, isMatchComplete, label }: TimerDisplayProps) => {
  return (
    <div className="flex flex-col items-center">
      {label && (
        <div className="text-volleyball-black text-2xl font-bold mb-2 tracking-wide uppercase">
          {label}
        </div>
      )}
      <div 
        className={cn(
          "font-score text-[12rem] tracking-[0.2em] leading-none mb-2",
          isBreak 
            ? "text-volleyball-black [text-shadow:_4px_4px_0_rgb(255_255_255),_-4px_-4px_0_rgb(255_255_255),_4px_-4px_0_rgb(255_255_255),_-4px_4px_0_rgb(255_255_255)]" 
            : "text-[#FFFFFF] [text-shadow:_4px_4px_0_rgb(0_0_0),_-4px_-4px_0_rgb(0_0_0),_4px_-4px_0_rgb(0_0_0),_-4px_4px_0_rgb(0_0_0)]"
        )}
      >
        {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
      </div>
    </div>
  );
};