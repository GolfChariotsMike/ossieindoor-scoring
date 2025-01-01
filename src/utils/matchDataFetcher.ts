import { toast } from "@/components/ui/use-toast";
import { format, parse } from "date-fns";
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
    console.log('Raw XML Response:', text);
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
      originalDate: date.toISOString(),
      selectedDate: selectedDate?.toISOString(),
      targetDate: format(date, 'yyyy-MM-dd')
    });
    
    const urls = LEAGUE_URLS[dayOfWeek];
    if (!urls) {
      console.error('No URLs configured for day:', dayOfWeek);
      throw new Error("No URLs configured for this day");
    }

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
      parseAttributeValue: false, // Changed to false to prevent automatic parsing
    });

    // Fetch and parse data from all URLs for the day
    const allFixtures = await Promise.all(
      urls.map(async (url) => {
        try {
          const text = await fetchFromUrl(url, formattedDate);
          const result = parser.parse(text);
          console.log('Parsed XML result:', JSON.stringify(result, null, 2));
          const fixtures = result?.League?.Week?.[0]?.Fixture || [];
          console.log('Extracted fixtures:', fixtures);
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
        // Extract just the date part from the fixture DateTime (before the space)
        const fixtureDatePart = fixture.DateTime.split(' ')[0];
        const targetDateStr = format(date, 'dd/MM/yyyy');
        
        console.log('Date comparison:', {
          fixtureDateTime: fixture.DateTime,
          fixtureDatePart,
          targetDate: targetDateStr,
          isMatch: fixtureDatePart === targetDateStr
        });
        
        return fixtureDatePart === targetDateStr;
      } catch (error) {
        console.error('Error comparing fixture date:', fixture.DateTime, error);
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