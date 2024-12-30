import { SetScores } from "@/types/volleyball";

interface SetScoresDisplayProps {
  setScores: SetScores;
}

export const SetScoresDisplay = ({ setScores }: SetScoresDisplayProps) => {
  // Always show 5 sets (maximum possible in volleyball)
  const sets = Array.from({ length: 5 }, (_, i) => ({
    home: setScores.home[i] || 0,
    away: setScores.away[i] || 0
  }));

  return (
    <div className="bg-volleyball-darkBlue rounded-lg p-4">
      <h2 className="text-white text-xl mb-4 text-center">Set Scores</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          {sets.map((set, index) => (
            <div key={index} className="text-white text-lg mb-2">
              Set {index + 1}: {set.home}
            </div>
          ))}
        </div>
        <div className="text-center">
          {sets.map((set, index) => (
            <div key={index} className="text-white text-lg mb-2">
              Set {index + 1}: {set.away}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};