import { SetScores } from "@/types/volleyball";

interface SetScoresDisplayProps {
  setScores: SetScores;
}

export const SetScoresDisplay = ({ setScores }: SetScoresDisplayProps) => {
  return (
    <div className="bg-volleyball-darkBlue rounded-lg p-4">
      <h2 className="text-white text-xl mb-4 text-center">Set Scores</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          {setScores.home.map((score, index) => (
            <div key={index} className="text-white">
              Set {index + 1}: {score}
            </div>
          ))}
        </div>
        <div className="text-center">
          {setScores.away.map((score, index) => (
            <div key={index} className="text-white">
              Set {index + 1}: {score}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};