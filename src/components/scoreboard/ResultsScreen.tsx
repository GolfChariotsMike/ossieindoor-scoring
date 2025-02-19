
import { Match } from "@/types/volleyball";
import { Fireworks } from "./Fireworks";
import { TeamsDisplay } from "./TeamsDisplay";
import { SetScoresDisplay } from "./SetScoresDisplay";
import { NextMatchCountdown } from "./NextMatchCountdown";

interface ResultsScreenProps {
  match: Match;
  setScores: {
    home: number[];
    away: number[];
  };
  isTeamsSwitched: boolean;
  onStartNextMatch: () => void;
  resultsDisplayStartTime?: number;
}

export const ResultsScreen = ({ 
  match, 
  setScores, 
  isTeamsSwitched,
  resultsDisplayStartTime
}: ResultsScreenProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-8 relative overflow-hidden">
      <Fireworks />
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-4xl w-full mx-auto z-10">
        <h1 className="text-4xl font-bold text-center mb-8 text-volleyball-black">
          Match Complete
        </h1>
        
        <TeamsDisplay
          match={match}
          isTeamsSwitched={isTeamsSwitched}
          className="mb-8"
        />
        
        <SetScoresDisplay
          setScores={setScores}
          isTeamsSwitched={isTeamsSwitched}
        />

        {resultsDisplayStartTime && (
          <NextMatchCountdown 
            startTime={resultsDisplayStartTime} 
            totalDuration={50000} // 50 seconds
          />
        )}
      </div>
    </div>
  );
};
