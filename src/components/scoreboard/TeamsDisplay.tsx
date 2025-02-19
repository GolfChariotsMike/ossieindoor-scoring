
import { Match } from "@/types/volleyball";

interface TeamsDisplayProps {
  match: Match;
  isTeamsSwitched: boolean;
  className?: string;
}

export const TeamsDisplay = ({
  match,
  isTeamsSwitched,
  className = ""
}: TeamsDisplayProps) => {
  const homeTeam = isTeamsSwitched ? match.awayTeam : match.homeTeam;
  const awayTeam = isTeamsSwitched ? match.homeTeam : match.awayTeam;

  return (
    <div className={`grid grid-cols-2 gap-16 items-center ${className}`}>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-volleyball-black">{homeTeam.name}</h2>
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-volleyball-black">{awayTeam.name}</h2>
      </div>
    </div>
  );
};
