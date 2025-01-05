import { Team } from "@/types/volleyball";
import { TeamScore } from "./TeamScore";

interface TeamsDisplayProps {
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  onHomeScore: (increment: boolean) => void;
  onAwayScore: (increment: boolean) => void;
  onStatUpdate: (team: "home" | "away", type: "block" | "ace") => void;
}

export const TeamsDisplay = ({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  onHomeScore,
  onAwayScore,
  onStatUpdate,
}: TeamsDisplayProps) => {
  return (
    <div className="grid grid-cols-2 gap-16 items-center">
      <TeamScore
        teamName={homeTeam.name}
        score={homeScore}
        onScoreUpdate={onHomeScore}
        onStatUpdate={(type) => onStatUpdate("home", type)}
      />
      <TeamScore
        teamName={awayTeam.name}
        score={awayScore}
        onScoreUpdate={onAwayScore}
        onStatUpdate={(type) => onStatUpdate("away", type)}
      />
    </div>
  );
};