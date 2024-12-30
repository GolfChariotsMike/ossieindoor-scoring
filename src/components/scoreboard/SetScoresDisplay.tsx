import { SetScores } from "@/types/volleyball";
import { Match } from "@/types/volleyball";

interface SetScoresDisplayProps {
  setScores: SetScores;
  match: Match;
  isTeamsSwitched: boolean;
}

export const SetScoresDisplay = ({ setScores, match, isTeamsSwitched }: SetScoresDisplayProps) => {
  const sets = Array.from({ length: 3 }, (_, i) => ({
    home: setScores.home[i] || 0,
    away: setScores.away[i] || 0
  }));

  const homeTeam = isTeamsSwitched ? match.awayTeam : match.homeTeam;
  const awayTeam = isTeamsSwitched ? match.homeTeam : match.awayTeam;

  return (
    <div className="bg-volleyball-darkBlue rounded-lg p-4">
      <div className="flex justify-between mb-2 px-4">
        <div className="text-white text-lg font-semibold">{homeTeam.name}</div>
        <div className="text-white text-lg font-semibold">{awayTeam.name}</div>
      </div>
      <div className="flex justify-around">
        {sets.map((set, index) => (
          <div key={index} className="text-center px-4">
            <div className="text-white text-sm mb-2">Set {index + 1}</div>
            <div className="grid grid-rows-2 gap-2">
              <div className="text-white text-2xl font-bold">{set.home}</div>
              <div className="text-white text-2xl font-bold">{set.away}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};