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

  return (
    <div className="flex flex-col justify-center space-y-4">
      {sets.map((set, index) => (
        <div 
          key={index} 
          className="bg-volleyball-lightBlue p-4 rounded-lg border-4 border-volleyball-gold shadow-lg h-28 flex items-center justify-center"
        >
          <div className="text-white text-4xl font-mono tracking-wider">
            {set.home}-{set.away}
          </div>
        </div>
      ))}
    </div>
  );
};