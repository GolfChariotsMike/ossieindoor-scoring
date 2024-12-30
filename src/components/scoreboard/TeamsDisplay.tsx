import { TeamScore } from "./TeamScore";
import { Team } from "@/types/volleyball";

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
    <div className="grid grid-cols-3 gap-4 items-center">
      <TeamScore
        teamName={homeTeam.name}
        score={homeScore}
        onScoreUpdate={onHomeScore}
      />

      <div className="text-white text-4xl text-center">vs</div>

      <TeamScore
        teamName={awayTeam.name}
        score={awayScore}
        onScoreUpdate={onAwayScore}
      />
    </div>
  );
};