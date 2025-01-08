import { useParams } from "react-router-dom";
import { format, parse } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { fetchMatchData } from "@/utils/matchDataFetcher";
import { Fixture } from "@/types/volleyball";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";

const CourtFixtures = () => {
  const { courtId, date } = useParams();
  const navigate = useNavigate();

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["matches", date],
    queryFn: async () => {
      const result = await fetchMatchData(undefined, date ? new Date(date) : new Date());
      return (Array.isArray(result) ? result : []).map(item => ({
        ...item,
        Id: item.Id || item.id || `${item.DateTime}-${item.PlayingAreaName}`,
      })) as Fixture[];
    },
  });

  console.log('Received matches:', matches);

  // Filter and sort court fixtures
  const courtFixtures = Array.isArray(matches) 
    ? matches
        .filter((match: Fixture) => match.PlayingAreaName === `Court ${courtId}`)
        .sort((a: Fixture, b: Fixture) => {
          try {
            const dateA = parse(a.DateTime, 'dd/MM/yyyy HH:mm', new Date());
            const dateB = parse(b.DateTime, 'dd/MM/yyyy HH:mm', new Date());
            return dateA.getTime() - dateB.getTime();
          } catch (error) {
            console.error('Error parsing dates:', error, { dateA: a.DateTime, dateB: b.DateTime });
            return 0;
          }
        })
    : [];

  console.log('Filtered and sorted court fixtures:', courtFixtures);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-volleyball-red">
        <div className="bg-volleyball-black/80 p-8 rounded-lg">
          <div className="text-volleyball-cream">Loading fixtures...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-volleyball-red">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-volleyball-cream">
            Court {courtId} Fixtures
          </h1>
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="bg-volleyball-black text-volleyball-cream hover:bg-volleyball-black/90"
          >
            Back to Courts
          </Button>
        </div>

        <div className="space-y-4">
          {courtFixtures.length === 0 ? (
            <Card className="p-6 bg-volleyball-black/80 text-volleyball-cream">
              <p>No fixtures found for this court.</p>
            </Card>
          ) : (
            courtFixtures.map((fixture: Fixture) => (
              <Card
                key={fixture.Id}
                className="p-6 bg-volleyball-black/80 hover:bg-volleyball-black/90 transition-colors cursor-pointer"
                onClick={() => {
                  const fixtureParam = encodeURIComponent(JSON.stringify(fixture));
                  navigate(`/scoreboard/${courtId}?fixture=${fixtureParam}`);
                }}
              >
                <div className="flex justify-between items-center text-volleyball-cream">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{fixture.HomeTeam} vs {fixture.AwayTeam}</h3>
                    <p className="text-sm opacity-80">{fixture.DivisionName}</p>
                  </div>
                  <div className="flex items-center">
                    <CalendarDays className="w-5 h-5 mr-2" />
                    <span>{fixture.DateTime}</span>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CourtFixtures;