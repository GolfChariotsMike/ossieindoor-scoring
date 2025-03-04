
import { toast } from "@/hooks/use-toast";
import { format, parse } from "date-fns";
import { Match, Fixture } from "@/types/volleyball";
import { LEAGUE_URLS } from "@/config/leagueConfig";
import { parseXMLResponse } from "@/utils/xmlParser";
import { saveCourtMatches, getCourtMatches } from "@/services/indexedDB";
import { isOffline } from "@/utils/offlineMode";

const fetchFromUrl = async (url: string, date: string) => {
  try {
    // If in offline mode, don't fetch from remote
    if (isOffline()) {
      throw new Error("Offline mode - cannot fetch fixture data");
    }
    
    console.log('Fetching from URL:', url, 'with date:', date);
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
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
    });

    // Try to get matches from IndexedDB first
    if (courtId) {
      try {
        const cachedMatches = await getCourtMatches(courtId, formattedDate);
        if (cachedMatches.length > 0) {
          console.log('Found cached matches:', cachedMatches.length);
          return cachedMatches;
        }
      } catch (error) {
        console.error('Error reading from cache:', error);
      }
    }

    // If we're in offline mode and don't have cached matches, return default data
    if (isOffline()) {
      console.log('Offline mode enabled, using default match data');
      
      if (courtId) {
        return {
          id: `default-match-${courtId}`,
          court: parseInt(courtId),
          startTime: new Date().toISOString(),
          homeTeam: { id: "team-1", name: "Team A" },
          awayTeam: { id: "team-2", name: "Team B" },
          division: "Default Division"
        };
      }
      
      return [];
    }

    const urls = LEAGUE_URLS[dayOfWeek];
    if (!urls || urls.length === 0) {
      console.error('No URLs configured for day:', dayOfWeek);
      throw new Error("No URLs configured for this day");
    }

    // Fetch and parse data from all URLs for the day
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

    // Combine and flatten fixtures from all sources
    let fixtures = allFixtures.flat();
    console.log('Total number of fixtures found:', fixtures.length);

    // Filter fixtures by the selected date
    fixtures = fixtures.filter(fixture => {
      if (!fixture?.DateTime) return false;
      
      try {
        // Parse the fixture date in the format "dd/MM/yyyy HH:mm"
        const fixtureDate = parse(fixture.DateTime, 'dd/MM/yyyy HH:mm', new Date());
        const targetDate = parse(formattedDate, 'dd/MM/yyyy', new Date());
        
        // Compare only the date parts (ignore time)
        const isSameDate = format(fixtureDate, 'yyyy-MM-dd') === format(targetDate, 'yyyy-MM-dd');
        
        console.log('Date comparison for fixture:', {
          fixtureDateTime: fixture.DateTime,
          parsedFixtureDate: format(fixtureDate, 'yyyy-MM-dd'),
          targetDate: format(targetDate, 'yyyy-MM-dd'),
          isSameDate,
          court: fixture.PlayingAreaName
        });
        
        return isSameDate;
      } catch (error) {
        console.error('Error comparing fixture date:', fixture.DateTime, error);
        return false;
      }
    });

    // Map XMLFixtures to CourtMatch format before saving
    const courtMatches = fixtures.map(fixture => ({
      id: fixture.Id || `${fixture.DateTime}-${fixture.PlayingAreaName}`,
      PlayingAreaName: fixture.PlayingAreaName,
      DateTime: fixture.DateTime,
      ...fixture
    }));

    // Save all fixtures to IndexedDB for offline access, 
    // regardless of whether a specific court was requested
    try {
      await saveCourtMatches(courtMatches);
      console.log('Saved fixtures to IndexedDB:', courtMatches.length);
    } catch (error) {
      console.error('Error caching fixtures:', error);
    }

    console.log('Fixtures after date filtering:', fixtures.length);

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
