import { toast } from "@/components/ui/use-toast";
import { format, parse } from "date-fns";
import { XMLParser } from 'fast-xml-parser';
import { Match } from "@/types/volleyball";

const LEAGUE_URLS = {
  Monday: ['https://ossieindoorbeachvolleyball.spawtz.com/External/Fixtures/Feed.aspx?Type=Fixtures&LeagueId=2&SeasonId=4'],
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
  const response = await fetch(`${url}&Date=${date}`);
  if (!response.ok) {
    throw new Error("Failed to fetch fixture data");
  }
  return response.text();
};

export const fetchMatchData = async (courtId?: string, selectedDate?: Date) => {
  try {
    const date = selectedDate || new Date();
    const formattedDate = format(date, 'dd/MM/yyyy');
    const dayOfWeek = format(date, 'EEEE') as keyof typeof LEAGUE_URLS;
    
    const urls = LEAGUE_URLS[dayOfWeek];
    if (!urls) {
      throw new Error("No URLs configured for this day");
    }

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
    });

    // Fetch and parse data from all URLs for the day
    const allFixtures = await Promise.all(
      urls.map(async (url) => {
        try {
          const text = await fetchFromUrl(url, formattedDate);
          const result = parser.parse(text);
          console.log('Parsed XML result:', result);
          return result?.League?.Week?.[0]?.Fixture || [];
        } catch (error) {
          console.error('Error fetching from URL:', url, error);
          return [];
        }
      })
    );

    // Combine and flatten fixtures from all sources
    const fixtures = allFixtures.flat();
    console.log('Combined fixtures:', fixtures);
    
    // Helper function to parse the date string
    const parseDateTime = (dateTimeStr: string) => {
      try {
        return parse(dateTimeStr, 'dd/MM/yyyy HH:mm', new Date()).toISOString();
      } catch (error) {
        console.error('Error parsing date:', dateTimeStr, error);
        return new Date().toISOString();
      }
    };

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
        startTime: parseDateTime(currentMatch.DateTime),
        homeTeam: { id: currentMatch.HomeTeamId, name: currentMatch.HomeTeam },
        awayTeam: { id: currentMatch.AwayTeamId, name: currentMatch.AwayTeam },
      };
    }

    // Transform all fixtures
    const transformedData = Array.isArray(fixtures) ? fixtures : [fixtures];
    return transformedData.map(fixture => ({
      ...fixture,
      DateTime: parseDateTime(fixture.DateTime)
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