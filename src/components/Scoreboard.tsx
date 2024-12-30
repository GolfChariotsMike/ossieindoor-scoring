import { useState } from "react";
import { useParams } from "react-router-dom";
import { Score, SetScores } from "@/types/volleyball";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";

const Scoreboard = () => {
  const { courtId } = useParams();
  const { toast } = useToast();
  const [currentScore, setCurrentScore] = useState<Score>({ home: 0, away: 0 });
  const [setScores, setSetScores] = useState<SetScores>({ home: [], away: [] });

  const fetchMatchData = async (courtId: string) => {
    try {
      const response = await fetch(
        "https://ossieindoorbeachvolleyball.spawtz.com/External/Fixtures/Feed.aspx?Type=Fixtures&LeagueId=2&SeasonId=4"
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch fixture data");
      }

      const data = await response.json();
      // Find the current match for this court
      const currentMatch = data.find(
        (match: any) => match.PlayingAreaName === `Court ${courtId}`
      );

      if (!currentMatch) {
        throw new Error(`No match found for Court ${courtId}`);
      }

      return {
        id: currentMatch.id || "match-1",
        court: parseInt(courtId),
        startTime: currentMatch.DateTime,
        homeTeam: { id: "team-1", name: currentMatch.HomeTeam },
        awayTeam: { id: "team-2", name: currentMatch.AwayTeam },
      };
    } catch (error) {
      console.error("Error fetching match data:", error);
      toast({
        title: "Error",
        description: "Failed to load match data. Using fallback data.",
        variant: "destructive",
      });
      
      // Return fallback data if the API fails
      return {
        id: "match-1",
        court: parseInt(courtId),
        startTime: new Date().toISOString(),
        homeTeam: { id: "team-1", name: "Team A" },
        awayTeam: { id: "team-2", name: "Team B" },
      };
    }
  };

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
          <div className="text-white text-center mb-4">
            <div className="text-xl">Court {match.court}</div>
            <div className="text-sm opacity-75">
              {new Date(match.startTime).toLocaleTimeString()}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="text-center">
              <div className="text-white text-xl mb-2">{match.homeTeam.name}</div>
              <Button
                className="w-full h-20 text-3xl bg-volleyball-lightBlue hover:bg-volleyball-gold transition-colors"
                onClick={() => handleScore("home")}
              >
                {currentScore.home}
              </Button>
            </div>

            <div className="text-white text-4xl text-center">vs</div>

            <div className="text-center">
              <div className="text-white text-xl mb-2">{match.awayTeam.name}</div>
              <Button
                className="w-full h-20 text-3xl bg-volleyball-lightBlue hover:bg-volleyball-gold transition-colors"
                onClick={() => handleScore("away")}
              >
                {currentScore.away}
              </Button>
            </div>
          </div>
        </div>

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
      </div>
    </div>
  );
};

export default Scoreboard;