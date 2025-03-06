import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchMatchData } from "@/utils/matchDataFetcher";
import { Button } from "@/components/ui/button";
import { format, parse } from "date-fns";
import { Fixture } from "@/types/volleyball";
import { isOffline, disableForcedOfflineMode } from "@/utils/offlineMode";
import { getCourtMatches, saveCourtMatches } from "@/services/indexedDB";
import { toast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { RefreshCw } from "lucide-react";

const CourtFixtures = () => {
  const { courtId, date } = useParams();
  const navigate = useNavigate();
  
  const parsedDate = date ? parse(date, 'yyyy-MM-dd', new Date()) : new Date();
  const formattedDate = format(parsedDate, 'dd/MM/yyyy');
  
  console.log('CourtFixtures date parsing:', {
    urlDate: date,
    parsedDate: parsedDate.toISOString(),
    formattedForDisplay: format(parsedDate, 'yyyy-MM-dd'),
    formattedForQuery: formattedDate,
    courtId,
    isOfflineMode: isOffline()
  });

  useEffect(() => {
    const wasOffline = isOffline();
    if (wasOffline) {
      try {
        console.log('Attempting to go online for fixture loading');
        disableForcedOfflineMode();
      } catch (error) {
        console.error('Error disabling offline mode:', error);
      }
    }
  }, []);

  const { data: matches = [], isLoading, refetch } = useQuery({
    queryKey: ["matches", date, courtId],
    queryFn: async () => {
      console.log('Fetching matches in CourtFixtures...');
      
      try {
        if (navigator.onLine) {
          try {
            const fetchedMatches = await fetchMatchData(undefined, parsedDate);
            console.log('Fetched matches from server:', Array.isArray(fetchedMatches) ? fetchedMatches.length : 'not an array');
            
            if (Array.isArray(fetchedMatches) && fetchedMatches.length > 0) {
              try {
                const courtMatches = fetchedMatches.map(fixture => ({
                  id: fixture.Id || `${fixture.DateTime}-${fixture.PlayingAreaName}`,
                  PlayingAreaName: fixture.PlayingAreaName,
                  DateTime: fixture.DateTime,
                  courtId: courtId,
                  courtNumberStr: courtId,
                  ...fixture
                }));
                
                await saveCourtMatches(courtMatches);
                console.log('Cached all fixtures for future offline use', courtMatches.length);
              } catch (cacheError) {
                console.error('Error caching fixtures for offline use:', cacheError);
              }
            }
            
            return fetchedMatches;
          } catch (fetchError) {
            console.error('Error fetching from server, will try local cache:', fetchError);
          }
        }
        
        console.log('Getting matches from local IndexedDB...');
        const localMatches = await getCourtMatches(courtId || '', formattedDate);
        console.log('Local matches retrieved:', localMatches);
        
        if (localMatches.length > 0) {
          return localMatches;
        } else if (isOffline()) {
          toast({
            title: "No matches available offline",
            description: "No matches found in local storage. Please reconnect to the internet and try again.",
            variant: "destructive",
          });
          return [];
        }
        
        if (navigator.onLine) {
          const lastTryMatches = await fetchMatchData(undefined, parsedDate);
          console.log('Last attempt fetch results:', lastTryMatches.length);
          return lastTryMatches;
        }
        
        return [];
      } catch (error) {
        console.error('Error in fixture query function:', error);
        return [];
      }
    },
    retry: 3,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!isLoading && Array.isArray(matches) && matches.length === 0 && navigator.onLine) {
      console.log('No matches loaded initially, attempting refetch...');
      setTimeout(() => {
        refetch();
      }, 1000);
    }
  }, [isLoading, matches, refetch]);

  console.log('Received matches:', matches);

  const courtFixtures = Array.isArray(matches) 
    ? matches
        .filter((match: Fixture) => match.PlayingAreaName === `Court ${courtId}`)
        .sort((a: Fixture, b: Fixture) => {
          try {
            const timeA = parse(a.DateTime, 'dd/MM/yyyy HH:mm', new Date());
            const timeB = parse(b.DateTime, 'dd/MM/yyyy HH:mm', new Date());
            return timeA.getTime() - timeB.getTime();
          } catch (error) {
            console.error('Error parsing date during sorting:', error);
            return 0;
          }
        })
    : [];

  console.log('Filtered and sorted court fixtures:', courtFixtures);

  const handleRefresh = () => {
    console.log('Manual refresh requested');
    toast({
      title: "Refreshing fixtures",
      description: "Fetching the latest fixture data...",
    });
    refetch();
  };

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
          <div className="flex space-x-4">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              className="bg-volleyball-cream text-volleyball-black hover:bg-volleyball-cream/90 text-xl py-6 px-4"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="bg-volleyball-cream text-volleyball-black hover:bg-volleyball-cream/90 text-xl py-6 px-8"
            >
              Back
            </Button>
          </div>
        </div>

        {isOffline() && (
          <div className="bg-yellow-600 text-volleyball-cream p-4 mb-6 rounded-lg">
            <p className="text-xl font-medium">You are in offline mode</p>
            <p>Fixtures loaded from local cache</p>
          </div>
        )}

        <div className="space-y-6">
          {courtFixtures.length > 0 ? (
            courtFixtures.map((fixture: Fixture, index: number) => (
              <Button
                key={index}
                variant="outline"
                className="w-full text-left justify-between p-6 bg-volleyball-black/80 hover:bg-volleyball-black/90 text-volleyball-cream text-xl"
                onClick={() =>
                  navigate(`/scoreboard/${courtId}`, {
                    state: { fixture },
                  })
                }
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
