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
                className="w-full text-left justify-between p-4 hover:bg-volleyball-lightBlue text-lg"
                onClick={() =>
                  navigate(`/scoreboard/${courtId}`, {
                    state: { fixture },
                  })
                }
              >
                <div className="flex justify-between items-center w-full">
                  <div className="font-semibold min-w-[100px]">
                    {format(new Date(fixture.DateTime), "h:mm a")}
                  </div>
                  <div className="text-center flex-1 px-4">
                    {fixture.HomeTeam} vs {fixture.AwayTeam}
                  </div>
                  <div className="text-sm text-gray-400 min-w-[120px] text-right">
                    {fixture.DivisionName}
                  </div>
                </div>
              </Button>
            ))
          ) : (
            <div className="text-white text-center p-4 bg-volleyball-darkBlue rounded-lg text-xl">
              No fixtures available for this court
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourtFixtures;