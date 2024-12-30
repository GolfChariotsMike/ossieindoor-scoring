import { SetScores, Match } from "@/types/volleyball";

interface SetScoresDisplayProps {
  setScores: SetScores;
  match: Match;
  isTeamsSwitched: boolean;
}

export const SetScoresDisplay = ({ setScores }: SetScoresDisplayProps) => {
  const sets = Array.from({ length: 3 }, (_, i) => ({
    home: setScores.home[i] || 0,
    away: setScores.away[i] || 0,
    number: i + 1
  }));

  return (
    <div className="flex flex-col items-center">
      <div className="text-volleyball-cream text-4xl uppercase tracking-[0.2em] mb-8">
        SETS
      </div>
      {sets.map((set) => (
        <div 
          key={set.number}
          className="grid grid-cols-2 gap-6 w-full mb-6"
        >
          <div className="bg-volleyball-black rounded-2xl p-6 flex items-center justify-center">
            <span className="text-volleyball-cream text-4xl font-mono">
              {set.home}
            </span>
          </div>
          <div className="bg-volleyball-black rounded-2xl p-6 flex items-center justify-center">
            <span className="text-volleyball-cream text-4xl font-mono">
              {set.away}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};