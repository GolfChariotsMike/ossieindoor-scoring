import { Team } from "@/types/volleyball";
import { TeamScore } from "./TeamScore";

interface TeamsDisplayProps {
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  onHomeScore: () => void;
  onAwayScore: () => void;
}

export const TeamsDisplay = ({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  onHomeScore,
  onAwayScore,
}: TeamsDisplayProps) => {
  return (
    <div className="grid grid-cols-2 gap-16 items-center">
      <TeamScore
        teamName={homeTeam.name}
        score={homeScore}
        onScoreUpdate={onHomeScore}
      />
      <TeamScore
        teamName={awayTeam.name}
        score={awayScore}
        onScoreUpdate={onAwayScore}
      />
    </div>
  );
};