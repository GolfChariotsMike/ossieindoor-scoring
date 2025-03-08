import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchMatchData } from "@/utils/matchDataFetcher";
import { Button } from "@/components/ui/button";
import { format, parse } from "date-fns";
import { Fixture } from "@/types/volleyball";
import { isOffline } from "@/utils/offlineMode";
import { getCourtMatches, saveCourtMatches } from "@/services/indexedDB";
import { toast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

const CourtFixtures = () => {
  const { courtId, date } = useParams();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
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

  const { data: matches = [], isLoading, refetch } = useQuery({
    queryKey: ["matches", date, courtId],
    queryFn: async () => {
      console.log('Fetching matches in CourtFixtures...');
      try {
        console.log('Fetching fresh data from server first...');
        const fetchedMatches = await fetchMatchData(undefined, parsedDate);
        console.log('Fetched matches from remote:', Array.isArray(fetchedMatches) ? fetchedMatches.length : 'not an array');
        
        if (Array.isArray(fetchedMatches) && fetchedMatches.length > 0) {
          return fetchedMatches;
        } 
        
        if (isOffline()) {
          console.log('Offline mode activated, fetching from local cache');
          const localMatches = await getCourtMatches(courtId || '', formattedDate);
          if (localMatches.length > 0) {
            return localMatches;
          }
          
          toast({
            title: "No matches available offline",
            description: "No matches found in local storage. Please reconnect to the internet and try again.",
            variant: "destructive",
          });
        }
        
        return fetchedMatches;
      } catch (error) {
        console.error('Error fetching matches:', error);
        return [];
      }
    },
    // Enable cache invalidation to force fresh data
    staleTime: isOffline() ? 1000 * 60 * 60 : 0, // 0 means always refetch when not offline
    gcTime: isOffline() ? 1000 * 60 * 60 : 1000 * 60 * 5, // 1 hour vs 5 minutes
  });

  const handleRefresh = async () => {
    if (isOffline()) {
      toast({
        title: "Offline Mode",
        description: "Cannot refresh data while offline",
        variant: "destructive",
      });
      return;
    }
    
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Data Refreshed",
        description: "Latest fixtures have been loaded",
        variant: "default",
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: "Refresh Failed",
        description: "Could not load the latest fixtures",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isOffline()) {
      refetch();
    }
  }, [refetch]);

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
              disabled={isRefreshing || isOffline()}
              className="bg-volleyball-cream text-volleyball-black hover:bg-volleyball-cream/90 flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
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
