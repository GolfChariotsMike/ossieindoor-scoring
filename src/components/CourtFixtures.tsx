import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchMatchData } from "@/utils/matchDataFetcher";
import { Button } from "@/components/ui/button";
import { format, parse } from "date-fns";
import { Fixture } from "@/types/volleyball";

const CourtFixtures = () => {
  const { courtId, date } = useParams();
  const navigate = useNavigate();
  
  // Parse the date from YYYY-MM-DD format
  const parsedDate = date ? parse(date, 'yyyy-MM-dd', new Date()) : new Date();
  console.log('Parsed date in CourtFixtures:', parsedDate);

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["matches", parsedDate],
    queryFn: () => fetchMatchData(undefined, parsedDate),
  });

  console.log('Received matches:', matches);

  const courtFixtures = Array.isArray(matches) 
    ? matches.filter((match: Fixture) => match.PlayingAreaName === `Court ${courtId}`)
    : [];

  console.log('Filtered court fixtures:', courtFixtures);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-volleyball-red flex items-center justify-center">
        <div className="text-volleyball-cream text-2xl">Loading fixtures...</div>
      </div>
    );
  }

  const getScoreDisplay = (fixture: Fixture) => {
    if (!fixture.HomeTeamScore || !fixture.AwayTeamScore) return null;
    
    try {
      const homeScores = JSON.parse(fixture.HomeTeamScore);
      const awayScores = JSON.parse(fixture.AwayTeamScore);
      
      return (
        <div className="text-sm text-volleyball-cream/90">
          {homeScores.map((score: number, index: number) => (
            <span key={index}>
              {score}-{awayScores[index]}
              {index < homeScores.length - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
      );
    } catch (e) {
      console.error('Error parsing scores:', e);
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-volleyball-red">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-volleyball-cream">Court {courtId} Fixtures</h1>
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="bg-volleyball-cream text-volleyball-black hover:bg-volleyball-cream/90"
          >
            Back
          </Button>
        </div>

        <div className="space-y-4">
          {courtFixtures.length > 0 ? (
            courtFixtures.map((fixture: Fixture, index: number) => (
              <Button
                key={index}
                variant="outline"
                className="w-full text-left justify-between p-4 bg-volleyball-black/80 hover:bg-volleyball-black/90 text-volleyball-cream text-lg"
                onClick={() =>
                  navigate(`/scoreboard/${courtId}`, {
                    state: { fixture },
                  })
                }
              >
                <div className="flex flex-col w-full">
                  <div className="flex justify-between items-center w-full">
                    <div className="font-semibold min-w-[100px]">
                      {format(new Date(fixture.DateTime), "h:mm a")}
                    </div>
                    <div className="text-center flex-1 px-4">
                      {fixture.HomeTeam} vs {fixture.AwayTeam}
                    </div>
                    <div className="text-sm text-volleyball-cream/70 min-w-[120px] text-right">
                      {fixture.DivisionName}
                    </div>
                  </div>
                  {getScoreDisplay(fixture)}
                </div>
              </Button>
            ))
          ) : (
            <div className="text-volleyball-cream text-center p-4 bg-volleyball-black/80 rounded-lg text-xl">
              No fixtures available for this court
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourtFixtures;