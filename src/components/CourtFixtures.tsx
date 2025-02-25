
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
  
  const parsedDate = date ? parse(date, 'yyyy-MM-dd', new Date()) : new Date();
  console.log('CourtFixtures date parsing:', {
    urlDate: date,
    parsedDate: parsedDate.toISOString(),
    formattedForDisplay: format(parsedDate, 'yyyy-MM-dd')
  });

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["matches", date],
    queryFn: () => fetchMatchData(undefined, parsedDate),
  });

  console.log('Received matches:', matches);

  const courtFixtures = Array.isArray(matches) 
    ? matches
        .filter((match: Fixture) => match.PlayingAreaName === `Court ${courtId}`)
        .sort((a: Fixture, b: Fixture) => {
          const timeA = parse(a.DateTime, 'dd/MM/yyyy HH:mm', new Date());
          const timeB = parse(b.DateTime, 'dd/MM/yyyy HH:mm', new Date());
          return timeA.getTime() - timeB.getTime();
        })
    : [];

  console.log('Filtered and sorted court fixtures:', courtFixtures);

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
        <div className="text-lg text-volleyball-cream/90">
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
            className="bg-volleyball-cream text-volleyball-black hover:bg-volleyball-cream/90 text-xl py-6 px-8"
          >
            Back
          </Button>
        </div>

        <div className="space-y-6">
          {courtFixtures.length > 0 ? (
            courtFixtures.map((fixture: Fixture, index: number) => (
              <Button
                key={index}
                variant="outline"
                className="w-full text-left justify-between p-6 bg-volleyball-black/80 hover:bg-volleyball-black/90 text-volleyball-cream text-xl"
                onClick={() => {
                  console.log('Starting navigation with fixture:', fixture);
                  const safeFixture = {
                    ...fixture,
                    Id: fixture.Id || `${fixture.DateTime}-${fixture.PlayingAreaName}`,
                  };
                  navigate(`/scoreboard/${courtId}`, {
                    state: { fixture: safeFixture }
                  });
                }}
              >
                <div className="flex flex-col w-full">
                  <div className="flex justify-between items-center w-full">
                    <div className="font-semibold text-2xl min-w-[120px]">
                      {format(parse(fixture.DateTime, 'dd/MM/yyyy HH:mm', new Date()), 'h:mm a')}
                    </div>
                    <div className="text-center flex-1 px-4 text-2xl">
                      {fixture.HomeTeam} vs {fixture.AwayTeam}
                    </div>
                    <div className="text-lg text-volleyball-cream/70 min-w-[140px] text-right">
                      {fixture.DivisionName}
                    </div>
                  </div>
                  {getScoreDisplay(fixture)}
                </div>
              </Button>
            ))
          ) : (
            <div className="text-volleyball-cream text-center p-6 bg-volleyball-black/80 rounded-lg text-2xl">
              No fixtures available for this court
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourtFixtures;
