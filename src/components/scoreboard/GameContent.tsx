import { Match, Score, SetScores } from "@/types/volleyball";
import { Timer } from "./Timer";
import { GameScores } from "./GameScores";

interface GameContentProps {
  isBreak: boolean;
  currentScore: Score;
  setScores: SetScores;
  match: Match;
  isTeamsSwitched: boolean;
  isMatchComplete: boolean;
  onTimerComplete: () => void;
  onSwitchTeams: () => void;
  onScoreUpdate: (team: "home" | "away", increment: boolean) => void;
}

export const GameContent = ({
  isBreak,
  currentScore,
  setScores,
  match,
  isTeamsSwitched,
  isMatchComplete,
  onTimerComplete,
  onSwitchTeams,
  onScoreUpdate,
}: GameContentProps) => {
  return (
    <>
      <Timer
        initialMinutes={1}
        onComplete={onTimerComplete}
        onSwitchTeams={onSwitchTeams}
        isBreak={isBreak}
        isMatchComplete={isMatchComplete}
      />

      <GameScores
        currentScore={currentScore}
        setScores={setScores}
        match={match}
        isTeamsSwitched={isTeamsSwitched}
        onScoreUpdate={onScoreUpdate}
      />
    </>
  );
};