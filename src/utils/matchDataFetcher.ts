
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
    

    // If in offline mode and we have a court ID, try to get matches from cache
    // Only use cached data in offline mode, never when online
    if (isOffline() && courtId) {
      try {
        // Try getting matches for the specific date first
        let cachedMatches = await getCourtMatches(courtId, formattedDate);
        
        // If no matches found for this date, try all matches for the court
        if (cachedMatches.length === 0) {
          cachedMatches = await getAllCourtMatches(courtId);
        }
        
        if (cachedMatches.length > 0) {
          return cachedMatches;
        }
        
      } catch (error) {
        console.error('Error reading from cache:', error);
      }
    }

    if (isOffline()) {
      
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

    const urls = LEAGUE_URLS[dayOfWeek];
    if (!urls || urls.length === 0) {
      console.error('No URLs configured for day:', dayOfWeek);
      throw new Error("No URLs configured for this day");
    }

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

    try {
      await saveCourtMatches(courtMatches);
    } catch (error) {
      console.error('Error caching fixtures:', error);
    }


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
