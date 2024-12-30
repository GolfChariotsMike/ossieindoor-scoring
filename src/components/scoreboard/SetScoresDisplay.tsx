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
      <div className="grid grid-cols-[200px_1fr] gap-4">
        {/* Team Names Column */}
        <div>
          <div className="text-white text-sm mb-2">Teams</div>
          <div className="flex flex-col space-y-4">
            <div className="text-white text-2xl font-semibold h-16 flex items-center justify-center">{homeTeam.name}</div>
            <div className="text-white text-2xl font-semibold h-16 flex items-center justify-center">{awayTeam.name}</div>
          </div>
        </div>

        {/* Scores Column */}
        <div className="flex justify-around items-center">
          {sets.map((set, index) => (
            <div key={index} className="text-center px-4 flex-1">
              <div className="text-white text-sm mb-2">Set {index + 1}</div>
              <div className="grid grid-rows-2 gap-4">
                <div className="text-white text-2xl font-bold h-16 flex items-center justify-center">{set.home}</div>
                <div className="text-white text-2xl font-bold h-16 flex items-center justify-center">{set.away}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};