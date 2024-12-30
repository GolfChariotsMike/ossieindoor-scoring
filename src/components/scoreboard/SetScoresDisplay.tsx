import { SetScores, Match } from "@/types/volleyball";

interface SetScoresDisplayProps {
  setScores: SetScores;
  match: Match;
  isTeamsSwitched: boolean;
}

export const SetScoresDisplay = ({ setScores, isTeamsSwitched }: SetScoresDisplayProps) => {
  // Create an array of 3 sets, filling in scores where they exist
  const sets = Array.from({ length: 3 }, (_, i) => ({
    home: setScores.home[i] ?? 0,
    away: setScores.away[i] ?? 0,
    number: i + 1
  }));

  console.log('Current set scores:', setScores); // Add logging to debug

  return (
    <div className="flex flex-col items-center">
      <div className="text-volleyball-cream font-sets text-4xl uppercase tracking-[0.2em] mb-8">
        SETS
      </div>
      {sets.map((set) => (
        <div 
          key={set.number}
          className="grid grid-cols-2 gap-6 w-full mb-6"
        >
          <div className="bg-volleyball-black rounded-2xl p-6 flex items-center justify-center">
            <span className="text-volleyball-cream text-4xl font-score">
              {set.home}
            </span>
          </div>
          <div className="bg-volleyball-black rounded-2xl p-6 flex items-center justify-center">
            <span className="text-volleyball-cream text-4xl font-score">
              {set.away}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};