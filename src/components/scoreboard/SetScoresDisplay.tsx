import { SetScores, Match } from "@/types/volleyball";

interface SetScoresDisplayProps {
  setScores: SetScores;
  match: Match;
  isTeamsSwitched: boolean;
}

export const SetScoresDisplay = ({ setScores, isTeamsSwitched }: SetScoresDisplayProps) => {
  const sets = Array.from({ length: 3 }, (_, i) => ({
    home: isTeamsSwitched ? (setScores.away[i] ?? 0) : (setScores.home[i] ?? 0),
    away: isTeamsSwitched ? (setScores.home[i] ?? 0) : (setScores.away[i] ?? 0),
    number: i + 1
  }));

  console.log('SetScoresDisplay - Current set scores:', setScores);
  console.log('SetScoresDisplay - Formatted sets:', sets);

  return (
    <div className="flex flex-col items-center">
      <div className="text-volleyball-cream font-sets text-4xl uppercase tracking-[0.2em] mb-6">
        SETS
      </div>
      {sets.map((set) => (
        <div 
          key={set.number}
          className="grid grid-cols-2 gap-3 w-[110%] mb-4"
        >
          <div className="bg-volleyball-black rounded-2xl p-6 flex items-center justify-center">
            <span className="text-volleyball-cream text-8xl font-score">
              {set.home}
            </span>
          </div>
          <div className="bg-volleyball-black rounded-2xl p-6 flex items-center justify-center">
            <span className="text-volleyball-cream text-8xl font-score">
              {set.away}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};