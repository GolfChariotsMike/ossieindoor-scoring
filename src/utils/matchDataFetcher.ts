import { toast } from "@/components/ui/use-toast";
import { format, parse, isEqual, startOfDay } from "date-fns";
import { XMLParser } from 'fast-xml-parser';
import { Match } from "@/types/volleyball";

const LEAGUE_URLS = {
  Monday: [
    'https://ossieindoorbeachvolleyball.spawtz.com/External/Fixtures/Feed.aspx?Type=Fixtures&LeagueId=2&SeasonId=4',
    'https://ossieindoorbeachvolleyball.spawtz.com/External/Fixtures/Feed.aspx?Type=Fixtures&LeagueId=3&SeasonId=4'
  ],
  Tuesday: [
    'https://ossieindoorbeachvolleyball.spawtz.com/External/Fixtures/Feed.aspx?Type=Fixtures&LeagueId=6&SeasonId=4',
    'https://ossieindoorbeachvolleyball.spawtz.com/External/Fixtures/Feed.aspx?Type=Fixtures&LeagueId=5&SeasonId=4'
  ],
  Wednesday: [
    'https://ossieindoorbeachvolleyball.spawtz.com/External/Fixtures/Feed.aspx?Type=Fixtures&LeagueId=8&SeasonId=4',
    'https://ossieindoorbeachvolleyball.spawtz.com/External/Fixtures/Feed.aspx?Type=Fixtures&LeagueId=7&SeasonId=4'
  ],
  Thursday: ['https://ossieindoorbeachvolleyball.spawtz.com/External/Fixtures/Feed.aspx?Type=Fixtures&LeagueId=3&SeasonId=4'],
  Friday: ['https://ossieindoorbeachvolleyball.spawtz.com/External/Fixtures/Feed.aspx?Type=Fixtures&LeagueId=6&SeasonId=4'],
  Saturday: ['https://ossieindoorbeachvolleyball.spawtz.com/External/Fixtures/Feed.aspx?Type=Fixtures&LeagueId=7&SeasonId=4'],
  Sunday: ['https://ossieindoorbeachvolleyball.spawtz.com/External/Fixtures/Feed.aspx?Type=Fixtures&LeagueId=8&SeasonId=4']
};

const fetchFromUrl = async (url: string, date: string) => {
  try {
    console.log('Fetching from URL:', url, 'with date:', date);
    const response = await fetch(`${url}&Date=${date}`);
    if (!response.ok) {
      throw new Error("Failed to fetch fixture data");
    }
    const text = await response.text();
    console.log('Received response:', text.substring(0, 200) + '...'); // Log first 200 chars
    return text;
  } catch (error) {
    console.error('Error fetching from URL:', url, error);
    throw error;
  }
};

export const fetchMatchData = async (courtId?: string, selectedDate?: Date) => {
  try {
    const date = selectedDate || new Date();
    // Format date for the API request (dd/MM/yyyy)
    const formattedDate = format(date, 'dd/MM/yyyy');
    const dayOfWeek = format(date, 'EEEE') as keyof typeof LEAGUE_URLS;
    
    console.log('Fetching data for date:', {
      formattedDate,
      dayOfWeek,
      originalDate: date.toISOString()
    });
    
    const urls = LEAGUE_URLS[dayOfWeek];
    if (!urls) {
      console.error('No URLs configured for day:', dayOfWeek);
      throw new Error("No URLs configured for this day");
    }

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
      parseAttributeValue: true,
    });

    // Fetch and parse data from all URLs for the day
    const allFixtures = await Promise.all(
      urls.map(async (url) => {
        try {
          const text = await fetchFromUrl(url, formattedDate);
          const result = parser.parse(text);
          const fixtures = result?.League?.Week?.[0]?.Fixture || [];
          console.log('Parsed fixtures from URL:', url, fixtures);
          return fixtures;
        } catch (error) {
          console.error('Error fetching from URL:', url, error);
          return [];
        }
      })
    );

    // Combine and flatten fixtures from all sources
    let fixtures = allFixtures.flat();
    console.log('Combined fixtures:', fixtures);

    // Filter fixtures by the selected date
    fixtures = fixtures.filter(fixture => {
      if (!fixture.DateTime) return false;
      
      try {
        // Parse the fixture date from the XML format (dd/MM/yyyy HH:mm)
        const fixtureDate = parse(fixture.DateTime, 'dd/MM/yyyy HH:mm', new Date());
        const selectedDay = startOfDay(date);
        const fixtureDay = startOfDay(fixtureDate);
        
        const isMatchingDate = isEqual(selectedDay, fixtureDay);
        
        console.log('Date comparison:', {
          fixtureDateTime: fixture.DateTime,
          parsedFixtureDate: format(fixtureDate, 'yyyy-MM-dd HH:mm'),
          selectedDate: format(selectedDay, 'yyyy-MM-dd'),
          isMatch: isMatchingDate
        });
        
        return isMatchingDate;
      } catch (error) {
        console.error('Error parsing fixture date:', fixture.DateTime, error);
        return false;
      }
    });

    console.log('Final filtered fixtures:', fixtures);
    
    if (courtId) {
      const currentMatch = Array.isArray(fixtures) 
        ? fixtures.find((match) => match.PlayingAreaName === `Court ${courtId}`)
        : fixtures;

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
        startTime: parse(currentMatch.DateTime, 'dd/MM/yyyy HH:mm', new Date()).toISOString(),
        division: currentMatch.DivisionName,
        homeTeam: { id: currentMatch.HomeTeamId, name: currentMatch.HomeTeam },
        awayTeam: { id: currentMatch.AwayTeamId, name: currentMatch.AwayTeam },
      };
    }

    // Transform all fixtures
    return fixtures.map(fixture => ({
      ...fixture,
      DateTime: fixture.DateTime // Keep the original DateTime format
    }));

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