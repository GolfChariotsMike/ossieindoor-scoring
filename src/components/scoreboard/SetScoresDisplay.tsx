import { SetScores, Match } from "@/types/volleyball";

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
    <div className="flex flex-col justify-between h-full gap-4">
      <div className="text-volleyball-cream text-3xl text-center mb-2 uppercase tracking-wider">
        SETS
      </div>
      {sets.map((set, index) => (
        <div 
          key={index} 
          className="grid grid-cols-2 gap-2"
        >
          <div className="bg-volleyball-black rounded-2xl p-4 flex items-center justify-center">
            <span className="text-volleyball-cream text-3xl font-mono">
              {set.home}
            </span>
          </div>
          <div className="bg-volleyball-black rounded-2xl p-4 flex items-center justify-center">
            <span className="text-volleyball-cream text-3xl font-mono">
              {set.away}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};