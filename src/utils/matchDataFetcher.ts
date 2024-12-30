import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { parseString } from 'xml2js';
import { promisify } from 'util';

const parseXMLAsync = promisify(parseString);

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
    const result = await parseXMLAsync(text);
    
    // Extract fixtures from the XML structure
    const fixtures = result?.League?.Week?.[0]?.Fixture || [];
    
    // Transform the XML data into our expected format
    const transformedData = fixtures.map((fixture: any) => ({
      id: fixture.$.Id,
      DateTime: fixture.$.DateTime,
      PlayingAreaName: fixture.$.PlayingAreaName,
      HomeTeam: fixture.$.HomeTeam,
      AwayTeam: fixture.$.AwayTeam,
      HomeTeamScore: fixture.$.HomeTeamScore,
      AwayTeamScore: fixture.$.AwayTeamScore,
      HomeTeamSet1Score: fixture.$.HomeTeamSet1Score,
      AwayTeamSet1Score: fixture.$.AwayTeamSet1Score,
      HomeTeamSet2Score: fixture.$.HomeTeamSet2Score,
      AwayTeamSet2Score: fixture.$.AwayTeamSet2Score,
      HomeTeamSet3Score: fixture.$.HomeTeamSet3Score,
      AwayTeamSet3Score: fixture.$.AwayTeamSet3Score,
    }));

    if (courtId) {
      const currentMatch = transformedData.find(
        (match: any) => match.PlayingAreaName === `Court ${courtId}`
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
        id: currentMatch.id,
        court: parseInt(courtId),
        startTime: currentMatch.DateTime,
        homeTeam: { id: "team-1", name: currentMatch.HomeTeam },
        awayTeam: { id: "team-2", name: currentMatch.AwayTeam },
      };
    }

    return transformedData;
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