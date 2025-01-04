export type MatchPhase = 
  | "not_started"
  | "set1"
  | "break1"
  | "set2"
  | "break2"
  | "set3"
  | "final_break"
  | "results_display"
  | "complete";

export interface TimerProps {
  initialMinutes: number;
  onComplete: () => void;
  onSwitchTeams: () => void;
  isBreak: boolean;
  isMatchComplete: boolean;
  fixture?: { Id: string };
  onNextMatch?: () => void;
}