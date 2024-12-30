import { toast } from "@/components/ui/use-toast";
import { format, parse } from "date-fns";
import { XMLParser } from 'fast-xml-parser';
import { Match } from "@/types/volleyball";

export const fetchMatchData = async (courtId?: string, selectedDate?: Date) => {
  try {
    const formattedDate = selectedDate ? format(selectedDate, 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy');
    
    const response = await fetch(
      `https://ossieindoorbeachvolleyball.spawtz.com/External/Fixtures/Feed.aspx?Type=Fixtures&LeagueId=2&SeasonId=4&Date=${formattedDate}`
    );
    
    if (!response.ok) {
      throw new Error("Failed to fetch fixture data");
    }

    const text = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
    });
    
    const result = parser.parse(text);
    console.log('Parsed XML result:', result);
    
    // Extract fixtures from the XML structure
    const fixtures = result?.League?.Week?.[0]?.Fixture || [];
    console.log('Extracted fixtures:', fixtures);
    
    // Transform the XML data into our expected format
    const transformedData = Array.isArray(fixtures) ? fixtures : [fixtures];
    
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
      const currentMatch = transformedData.find(
        (match) => match.PlayingAreaName === `Court ${courtId}`
      );

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