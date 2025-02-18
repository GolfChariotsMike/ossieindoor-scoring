
import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { Match, Fixture } from "@/types/volleyball";
import { LEAGUE_URLS } from "@/config/leagueConfig";
import { parseXMLResponse } from "@/utils/xmlParser";
import { saveCourtMatches, getCourtMatches } from "@/services/indexedDB";

const fetchFromUrl = async (url: string, date: string) => {
  try {
    console.log('Fetching from URL:', url, 'with date:', date);
    const response = await fetch(`${url}&Date=${date}`);
    if (!response.ok) {
      throw new Error("Failed to fetch fixture data");
    }
    const text = await response.text();
    console.log('Raw XML Response for URL:', url);
    console.log(text);
    return text;
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
          return cachedMatches[0]; // Return the first match for this court
        }
      } catch (error) {
        console.error('Error reading from cache:', error);
      }
    }

    const urls = LEAGUE_URLS[dayOfWeek];
    if (!urls) {
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
        const fixtureDatePart = fixture.DateTime.split(' ')[0];
        const targetDateStr = format(date, 'dd/MM/yyyy');
        
        console.log('Date comparison for fixture:', {
          fullDateTime: fixture.DateTime,
          fixtureDatePart,
          targetDate: targetDateStr,
          isMatch: fixtureDatePart === targetDateStr,
          court: fixture.PlayingAreaName
        });
        
        return fixtureDatePart === targetDateStr;
      } catch (error) {
        console.error('Error comparing fixture date:', fixture.DateTime, error);
        return false;
      }
    });

    // Save all fixtures to IndexedDB for offline access
    try {
      await saveCourtMatches(fixtures);
      console.log('Saved fixtures to IndexedDB:', fixtures.length);
    } catch (error) {
      console.error('Error caching fixtures:', error);
    }

    console.log('Fixtures after date filtering:', fixtures.length);

    if (courtId) {
      const currentMatch = fixtures.find((match) => match.PlayingAreaName === `Court ${courtId}`);
      
      if (!currentMatch) {
        return {
          id: "match-1",
          court: parseInt(courtId),
          startTime: new Date().toISOString(),
          homeTeam: { id: "team-1", name: "Team A" },
          awayTeam: { id: "team-2", name: "Team B" },
        };
      }

      return {
        id: currentMatch.Id,
        court: parseInt(courtId),
        startTime: currentMatch.DateTime,
        division: currentMatch.DivisionName,
        homeTeam: { id: currentMatch.HomeTeamId, name: currentMatch.HomeTeam },
        awayTeam: { id: currentMatch.AwayTeamId, name: currentMatch.AwayTeam },
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
        id: "match-1",
        court: parseInt(courtId),
        startTime: new Date().toISOString(),
        homeTeam: { id: "team-1", name: "Team A" },
        awayTeam: { id: "team-2", name: "Team B" },
      };
    }
    
    return [];
  }
};
