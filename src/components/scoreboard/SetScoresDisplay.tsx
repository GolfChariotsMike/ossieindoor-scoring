import { SetScores } from "@/types/volleyball";

interface SetScoresDisplayProps {
  setScores: SetScores;
}

export const SetScoresDisplay = ({ setScores }: SetScoresDisplayProps) => {
  // Show 3 sets (standard volleyball match)
  const sets = Array.from({ length: 3 }, (_, i) => ({
    home: setScores.home[i] || 0,
    away: setScores.away[i] || 0
  }));

  return (
    <div className="bg-volleyball-darkBlue rounded-lg p-3">
      <h2 className="text-white text-lg mb-2 text-center">Set Scores</h2>
      <div className="flex justify-around">
        {sets.map((set, index) => (
          <div key={index} className="text-center px-2">
            <div className="text-white text-sm mb-1">Set {index + 1}</div>
            <div className="grid grid-rows-2 gap-1">
              <div className="text-white text-base">{set.home}</div>
              <div className="text-white text-base">{set.away}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};