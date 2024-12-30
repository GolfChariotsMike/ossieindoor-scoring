import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchMatchData } from "@/utils/matchDataFetcher";

const CourtSelection = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState<Date>(new Date());
  const [selectedCourt, setSelectedCourt] = useState<number | null>(null);
  const courts = [1, 2, 3, 4, 5, 6, 7, 8];

  const { data: matches, isLoading } = useQuery({
    queryKey: ["matches", date],
    queryFn: () => fetchMatchData(undefined, date),
  });

  const getCourtFixtures = (courtNumber: number) => {
    if (!matches) return [];
    return matches.filter(
      (match: any) => match.PlayingAreaName === `Court ${courtNumber}`
    );
  };

  return (
    <div className="min-h-screen bg-volleyball-navy p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          Volleyball Scoreboard
        </h1>

        <div className="bg-volleyball-darkBlue rounded-lg p-6 mb-8">
          <h2 className="text-white text-xl mb-4">Select Date</h2>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {courts.map((court) => {
            const fixtures = getCourtFixtures(court);
            return (
              <div
                key={court}
                className="bg-volleyball-darkBlue rounded-lg p-4"
              >
                <Button
                  className="w-full h-20 text-2xl mb-4 bg-volleyball-darkBlue hover:bg-volleyball-lightBlue transition-colors"
                  onClick={() => setSelectedCourt(court)}
                >
                  Court {court}
                </Button>
                {selectedCourt === court && (
                  <div className="space-y-2">
                    {fixtures.length > 0 ? (
                      fixtures.map((fixture: any, index: number) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="w-full text-left justify-start p-4"
                          onClick={() =>
                            navigate(`/scoreboard/${court}`, {
                              state: { fixture },
                            })
                          }
                        >
                          <div>
                            <div className="font-semibold">
                              {format(new Date(fixture.DateTime), "h:mm a")}
                            </div>
                            <div className="text-sm">
                              {fixture.HomeTeam} vs {fixture.AwayTeam}
                            </div>
                          </div>
                        </Button>
                      ))
                    ) : (
                      <div className="text-white text-center p-4">
                        No fixtures available for this court
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CourtSelection;