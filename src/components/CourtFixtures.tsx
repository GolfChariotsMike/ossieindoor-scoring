import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchMatchData } from "@/utils/matchDataFetcher";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Fixture } from "@/types/volleyball";

const CourtFixtures = () => {
  const { courtId, date } = useParams();
  const navigate = useNavigate();
  const parsedDate = date ? new Date(date) : new Date();

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["matches", parsedDate],
    queryFn: () => fetchMatchData(undefined, parsedDate),
  });

  const courtFixtures = Array.isArray(matches) 
    ? matches.filter((match: Fixture) => match.PlayingAreaName === `Court ${courtId}`)
    : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-volleyball-navy flex items-center justify-center">
        <div className="text-white text-2xl">Loading fixtures...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-volleyball-navy p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Court {courtId} Fixtures</h1>
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            className="text-white"
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
                className="w-full text-left justify-start p-4 hover:bg-volleyball-lightBlue"
                onClick={() =>
                  navigate(`/scoreboard/${courtId}`, {
                    state: { fixture },
                  })
                }
              >
                <div className="w-full">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">
                      {format(new Date(fixture.DateTime), "h:mm a")}
                    </span>
                    <span className="text-sm text-gray-400">
                      {fixture.DivisionName}
                    </span>
                  </div>
                  <div className="text-sm">
                    {fixture.HomeTeam} vs {fixture.AwayTeam}
                  </div>
                </div>
              </Button>
            ))
          ) : (
            <div className="text-white text-center p-4 bg-volleyball-darkBlue rounded-lg">
              No fixtures available for this court
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourtFixtures;