import { Timer } from "./Timer";
import { TeamControls } from "./TeamControls";
import { Fixture } from "@/types/volleyball";

interface ScoreboardHeaderProps {
  onTimerComplete: () => void;
  onSwitchTeams: () => void;
  isBreak: boolean;
  isMatchComplete: boolean;
  fixture: Fixture | undefined;
}

export const ScoreboardHeader = ({
  onTimerComplete,
  onSwitchTeams,
  isBreak,
  isMatchComplete,
  fixture,
}: ScoreboardHeaderProps) => {
  return (
    <div className="flex items-center justify-between w-full max-w-4xl mx-auto">
      <TeamControls
        team="home"
        onBlock={() => console.log('Home team block')}
        onAce={() => console.log('Home team ace')}
      />
      <Timer
        initialMinutes={14}
        onComplete={onTimerComplete}
        onSwitchTeams={onSwitchTeams}
        isBreak={isBreak}
        isMatchComplete={isMatchComplete}
        fixture={fixture}
      />
      <TeamControls
        team="away"
        onBlock={() => console.log('Away team block')}
        onAce={() => console.log('Away team ace')}
      />
    </div>
  );
};