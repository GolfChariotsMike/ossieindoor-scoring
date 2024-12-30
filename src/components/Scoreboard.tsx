import { useState } from "react";
import { useParams } from "react-router-dom";
import { Score, SetScores } from "@/types/volleyball";
import { useQuery } from "@tanstack/react-query";
import { fetchMatchData } from "@/utils/matchDataFetcher";
import { MatchHeader } from "./scoreboard/MatchHeader";
import { TeamScore } from "./scoreboard/TeamScore";
import { SetScoresDisplay } from "./scoreboard/SetScoresDisplay";

const Scoreboard = () => {
  const { courtId } = useParams();
  const [currentScore, setCurrentScore] = useState<Score>({ home: 0, away: 0 });
  const [setScores, setSetScores] = useState<SetScores>({ home: [], away: [] });

  const { data: match, isLoading } = useQuery({
    queryKey: ["match", courtId],
    queryFn: () => fetchMatchData(courtId!),
    enabled: !!courtId,
  });

  const handleScore = (team: "home" | "away") => {
    setCurrentScore((prev) => ({
      ...prev,
      [team]: prev[team] + 1,
    }));
  };

  if (isLoading || !match) {
    return (
      <div className="min-h-screen bg-volleyball-navy flex items-center justify-center">
        <div className="text-white text-2xl">Loading match data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-volleyball-navy p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-volleyball-darkBlue rounded-lg p-6 mb-4">
          <MatchHeader court={match.court} startTime={match.startTime} />

          <div className="grid grid-cols-3 gap-4 items-center">
            <TeamScore
              teamName={match.homeTeam.name}
              score={currentScore.home}
              onScoreUpdate={() => handleScore("home")}
            />

            <div className="text-white text-4xl text-center">vs</div>

            <TeamScore
              teamName={match.awayTeam.name}
              score={currentScore.away}
              onScoreUpdate={() => handleScore("away")}
            />
          </div>
        </div>

        <SetScoresDisplay setScores={setScores} />
      </div>
    </div>
  );
};

export default Scoreboard;