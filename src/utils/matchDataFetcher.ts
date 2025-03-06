import { toast } from "@/hooks/use-toast";
import { format, parse } from "date-fns";
import { Match, Fixture } from "@/types/volleyball";
import { LEAGUE_URLS } from "@/config/leagueConfig";
import { parseXMLResponse } from "@/utils/xmlParser";
import { saveCourtMatches, getCourtMatches, getAllCourtMatches } from "@/services/indexedDB";
import { isOffline, disableForcedOfflineMode } from "@/utils/offlineMode";

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
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch fixture data: ${response.status} ${response.statusText}`);
      }
      
      const text = await response.text();
      console.log('Raw XML Response for URL:', url);
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

export const fetchMatchData = async (courtId?: string, selectedDate?: Date): Promise<Fixture[]> => {
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

    // For court-specific fixtures, try to fetch online first unless definitely offline
    if (!isOffline() && courtId) {
      console.log('Attempting to fetch online data first for court:', courtId);
      try {
        // Try online fetch first
        const urls = LEAGUE_URLS[dayOfWeek];
        if (!urls || urls.length === 0) {
          console.error('No URLs configured for day:', dayOfWeek);
          throw new Error("No URLs configured for this day");
        }

        // Fetch all fixtures from all configured URLs
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
        console.log('Total number of fixtures found online:', fixtures.length);

        // Filter fixtures for correct date
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

        // Save all fixtures to IndexedDB for future offline use
        try {
          const courtMatches = fixtures.map(fixture => ({
            id: fixture.Id || `${fixture.DateTime}-${fixture.PlayingAreaName}`,
            courtId: courtId,  // Add courtId explicitly
            courtNumberStr: courtId,  // String court number
            PlayingAreaName: fixture.PlayingAreaName,
            DateTime: fixture.DateTime,
            court_number: parseInt(courtId),
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
          console.log('Saved ALL fixtures to IndexedDB:', courtMatches.length);
        } catch (error) {
          console.error('Error caching fixtures:', error);
        }

        // If looking for a specific court, return all fixtures anyway
        // This is a change from the original logic to always return an array
        return fixtures;
      } catch (error) {
        console.warn('Online fetch failed, falling back to local storage:', error);
        // Fall through to offline mode logic below
      }
    }

    // If in offline mode or online fetch failed, try to get matches from cache
    if (courtId) {
      console.log('Trying to get matches from cache for court:', courtId);
      try {
        // Try getting matches for the specific court and date first
        let cachedMatches = await getCourtMatches(courtId, formattedDate);
        
        if (cachedMatches.length === 0) {
          console.log('No matches found for court and date, trying all matches for this court');
          cachedMatches = await getAllCourtMatches(courtId);
        }
        
        if (cachedMatches.length > 0) {
          console.log('Found cached matches:', cachedMatches.length);
          // Return the cached matches array
          return cachedMatches;
        }
        
        console.log('No cached matches found, using default match');
      } catch (error) {
        console.error('Error reading from cache:', error);
      }
    }

    // If we're definitely offline and nothing in cache, use default data
    console.log('Using default match data (offline or no cached data)');
    
    // Always return an array, even for a single default match
    if (courtId) {
      const defaultMatch = {
        id: `default-match-${courtId}-${Date.now()}`,
        court_number: parseInt(courtId),
        PlayingAreaName: `Court ${courtId}`,
        DateTime: formattedDate + " 00:00",
        HomeTeam: "Team A",
        AwayTeam: "Team B",
        HomeTeamId: "team-1",
        AwayTeamId: "team-2",
        DivisionName: "Default Division"
      };
      return [defaultMatch];
    }
    
    return [];

  } catch (error) {
    console.error("Error fetching match data:", error);
    toast({
      title: "Error",
      description: "Failed to load match data. Using fallback data.",
      variant: "destructive",
    });
    
    // Always return an array for consistency
    if (courtId) {
      const fallbackMatch = {
        id: `fallback-match-${courtId}-${Date.now()}`,
        court_number: parseInt(courtId),
        PlayingAreaName: `Court ${courtId}`,
        DateTime: formattedDate + " 00:00",
        HomeTeam: "Team A",
        AwayTeam: "Team B",
        HomeTeamId: "team-1",
        AwayTeamId: "team-2",
        DivisionName: "Default Division"
      };
      return [fallbackMatch];
    }
    
    return [];
  }
};
