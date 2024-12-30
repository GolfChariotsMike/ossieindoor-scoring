import { toast } from "@/components/ui/use-toast";
import { format } from "date-fns";

export const fetchMatchData = async (courtId?: string, selectedDate?: Date) => {
  try {
    const formattedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
    
    const response = await fetch(
      `https://ossieindoorbeachvolleyball.spawtz.com/External/Fixtures/Feed.aspx?Type=Fixtures&LeagueId=2&SeasonId=4&Date=${formattedDate}`
    );
    
    if (!response.ok) {
      throw new Error("Failed to fetch fixture data");
    }

    const text = await response.text();
    // Try to parse the response as JSON, if it fails, it might be empty or invalid
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.log("Raw response:", text);
      // If parsing fails, return empty array or fallback data
      return courtId ? {
        id: "match-1",
        court: parseInt(courtId),
        startTime: new Date().toISOString(),
        homeTeam: { id: "team-1", name: "Team A" },
        awayTeam: { id: "team-2", name: "Team B" },
      } : [];
    }

    if (courtId) {
      const currentMatch = data.find(
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
        id: currentMatch.id || "match-1",
        court: parseInt(courtId),
        startTime: currentMatch.DateTime,
        homeTeam: { id: "team-1", name: currentMatch.HomeTeam },
        awayTeam: { id: "team-2", name: currentMatch.AwayTeam },
      };
    }

    return data || [];
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