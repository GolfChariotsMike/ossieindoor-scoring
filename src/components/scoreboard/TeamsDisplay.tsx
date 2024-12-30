import { TeamScore } from "./TeamScore";
import { Team } from "@/types/volleyball";
import { ScoreboardControls } from "./ScoreboardControls";

interface TeamsDisplayProps {
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  onHomeScore: () => void;
  onAwayScore: () => void;
  onSwitchTeams: () => void;
}

export const TeamsDisplay = ({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  onHomeScore,
  onAwayScore,
  onSwitchTeams,
}: TeamsDisplayProps) => {
  return (
    <div className="grid grid-cols-3 gap-4 items-center">
      <TeamScore
        teamName={homeTeam.name}
        score={homeScore}
        onScoreUpdate={onHomeScore}
      />

      <div className="flex flex-col items-center justify-center space-y-4">
        <ScoreboardControls onSwitchTeams={onSwitchTeams} />
      </div>

      <TeamScore
        teamName={awayTeam.name}
        score={awayScore}
        onScoreUpdate={onAwayScore}
      />
    </div>
  );
};