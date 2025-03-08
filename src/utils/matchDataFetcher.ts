
import { toast } from "@/hooks/use-toast";
import { format, parse } from "date-fns";
import { Match, Fixture } from "@/types/volleyball";
import { LEAGUE_URLS } from "@/config/leagueConfig";
import { parseXMLResponse } from "@/utils/xmlParser";
import { saveCourtMatches, getCourtMatches, getAllCourtMatches } from "@/services/indexedDB";
import { isOffline } from "@/utils/offlineMode";

const fetchFromUrl = async (url: string, date: string) => {
  try {
    if (isOffline()) {
      throw new Error("Offline mode - cannot fetch fixture data");
    }
    
    console.log('Fetching from URL:', url, 'with date:', date);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
      const response = await fetch(`${url}&Date=${date}`, { 
        signal: controller.signal,
        cache: 'no-store', // Force fresh data from server
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch fixture data: ${response.status} ${response.statusText}`);
      }
      
      const text = await response.text();
      console.log('Raw XML Response for URL:', url);
      console.log(text);
      return text;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Network request timed out');
      }
      throw error;
    }
  } catch (error) {
    console.error('Error fetching from URL:', url, error);
    throw error;
  }
};

export const fetchMatchData = async (courtId?: string, selectedDate?: Date) => {
  try {
    const date = selectedDate || new Date();
    const formattedDate = format(date, 'dd/MM/yyyy');
    const dayOfWeek = format(date, 'EEEE') as keyof typeof LEAGUE_URLS;
    
    console.log('Fetching data for:', {
      formattedDate,
      dayOfWeek,
      courtId,
      selectedDate: selectedDate?.toISOString(),
      offlineMode: isOffline()
    });

    // If we're in offline mode, try to get matches from cache
    if (isOffline()) {
      console.log('Offline mode - trying to get matches from cache first');
      try {
        // Try getting matches for the specific date first
        let cachedMatches = await getCourtMatches(courtId || '', formattedDate);
        
        // If no matches found for this date, try all matches for the court
        if (cachedMatches.length === 0) {
          console.log('No matches found for specified date, trying all matches for this court');
          cachedMatches = await getAllCourtMatches(courtId || '');
        }
        
        if (cachedMatches.length > 0) {
          console.log('Found cached matches:', cachedMatches.length);
          return cachedMatches;
        }
        
        console.log('No cached matches found, using default match');
      } catch (error) {
        console.error('Error reading from cache:', error);
      }
    }

    // If we're offline and reached here, use default data
    if (isOffline()) {
      console.log('Offline mode enabled, using default match data');
      
      if (courtId) {
        return {
          id: `default-match-${courtId}-${Date.now()}`,
          court: parseInt(courtId),
          startTime: new Date().toISOString(),
          homeTeam: { id: "team-1", name: "Team A" },
          awayTeam: { id: "team-2", name: "Team B" },
          division: "Default Division"
        };
      }
      
      return [];
    }

    // When online, always try to fetch fresh data first
    const urls = LEAGUE_URLS[dayOfWeek];
    if (!urls || urls.length === 0) {
      console.error('No URLs configured for day:', dayOfWeek);
      throw new Error("No URLs configured for this day");
    }

    // First, try to fetch fresh data from the server
    try {
      console.log('Attempting to fetch fresh fixture data from server...');
      const allFixtures = await Promise.all(
        urls.map(async (url) => {
          try {
            const text = await fetchFromUrl(url, formattedDate);
            return parseXMLResponse(text);
          } catch (error) {
            console.error('Error processing URL:', url, error);
            return [];
          }
        })
      );

      let fixtures = allFixtures.flat();
      console.log('Total number of fixtures found from server:', fixtures.length);

      if (fixtures.length > 0) {
        // Filter fixtures for the target date
        fixtures = fixtures.filter(fixture => {
          if (!fixture?.DateTime) return false;
          
          try {
            const fixtureDate = parse(fixture.DateTime, 'dd/MM/yyyy HH:mm', new Date());
            const targetDate = parse(formattedDate, 'dd/MM/yyyy', new Date());
            
            const isSameDate = format(fixtureDate, 'yyyy-MM-dd') === format(targetDate, 'yyyy-MM-dd');
            
            return isSameDate;
          } catch (error) {
            console.error('Error comparing fixture date:', fixture.DateTime, error);
            return false;
          }
        });

        console.log('Fixtures after date filtering:', fixtures.length);

        // Cache this data for future offline use
        try {
          const courtMatches = fixtures.map(fixture => ({
            id: fixture.Id || `${fixture.DateTime}-${fixture.PlayingAreaName}`,
            PlayingAreaName: fixture.PlayingAreaName,
            DateTime: fixture.DateTime,
            // Add these fields to ensure they're available for next match finding
            HomeTeam: fixture.HomeTeam,
            AwayTeam: fixture.AwayTeam,
            HomeTeamId: fixture.HomeTeamId,
            AwayTeamId: fixture.AwayTeamId,
            DivisionName: fixture.DivisionName,
            // Include all original fixture data too
            ...fixture
          }));
          
          await saveCourtMatches(courtMatches);
          console.log('Saved fresh fixtures to IndexedDB for future offline use:', courtMatches.length);
        } catch (cacheError) {
          console.error('Error caching fixtures:', cacheError);
        }
        
        // Return the specific match or all fixtures
        if (courtId) {
          const currentMatch = fixtures.find((match) => match.PlayingAreaName === `Court ${courtId}`);
          
          if (!currentMatch) {
            return {
              id: `default-match-${courtId}-${Date.now()}`,
              court: parseInt(courtId),
              startTime: new Date().toISOString(),
              homeTeam: { id: "team-1", name: "Team A" },
              awayTeam: { id: "team-2", name: "Team B" },
              division: "Default Division"
            };
          }

          return {
            id: currentMatch.Id || `match-${Date.now()}`,
            court: parseInt(courtId),
            startTime: currentMatch.DateTime,
            division: currentMatch.DivisionName,
            homeTeam: { id: currentMatch.HomeTeamId || `home-${Date.now()}`, name: currentMatch.HomeTeam },
            awayTeam: { id: currentMatch.AwayTeamId || `away-${Date.now()}`, name: currentMatch.AwayTeam },
          };
        }

        return fixtures;
      }
    } catch (freshDataError) {
      console.error('Failed to fetch fresh data, falling back to cache:', freshDataError);
      // We'll continue to try the cache as fallback
    }

    // If fetching fresh data failed, try to get from cache as fallback
    try {
      console.log('Fresh data fetch failed or empty, trying cache as fallback');
      const cachedMatches = await getCourtMatches(courtId || '', formattedDate);
      
      if (cachedMatches.length > 0) {
        console.log('Using cached fixtures as fallback:', cachedMatches.length);
        if (courtId) {
          const courtMatch = cachedMatches.find((match) => 
            match.PlayingAreaName === `Court ${courtId}` || 
            (match.court_number && match.court_number === parseInt(courtId))
          );
          
          if (courtMatch) {
            return {
              id: courtMatch.id || `match-${Date.now()}`,
              court: parseInt(courtId),
              startTime: courtMatch.DateTime || new Date().toISOString(),
              division: courtMatch.DivisionName || 'Unknown',
              homeTeam: { id: courtMatch.HomeTeamId || `home-${Date.now()}`, name: courtMatch.HomeTeam || 'Team A' },
              awayTeam: { id: courtMatch.AwayTeamId || `away-${Date.now()}`, name: courtMatch.AwayTeam || 'Team B' },
            };
          }
        }
        return cachedMatches;
      }
    } catch (cacheError) {
      console.error('Error accessing cache for fallback:', cacheError);
    }

    // Absolute fallback if everything else fails
    console.error("Could not fetch match data from any source");
    toast({
      title: "Error",
      description: "Failed to load match data. Using fallback data.",
      variant: "destructive",
    });
    
    if (courtId) {
      return {
        id: `fallback-match-${courtId}-${Date.now()}`,
        court: parseInt(courtId),
        startTime: new Date().toISOString(),
        homeTeam: { id: "team-1", name: "Team A" },
        awayTeam: { id: "team-2", name: "Team B" },
        division: "Default Division"
      };
    }
    
    return [];
  } catch (error) {
    console.error("Error fetching match data:", error);
    toast({
      title: "Error",
      description: "Failed to load match data. Using fallback data.",
      variant: "destructive",
    });
    
    if (courtId) {
      return {
        id: `fallback-match-${courtId}-${Date.now()}`,
        court: parseInt(courtId),
        startTime: new Date().toISOString(),
        homeTeam: { id: "team-1", name: "Team A" },
        awayTeam: { id: "team-2", name: "Team B" },
        division: "Default Division"
      };
    }
    
    return [];
  }
};
