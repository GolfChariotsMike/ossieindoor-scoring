import { toast } from "@/components/ui/use-toast";

export const fetchMatchData = async (courtId?: string) => {
  try {
    const response = await fetch(
      "https://ossieindoorbeachvolleyball.spawtz.com/External/Fixtures/Feed.aspx?Type=Fixtures&LeagueId=2&SeasonId=4"
    );
    
    if (!response.ok) {
      throw new Error("Failed to fetch fixture data");
    }

    const data = await response.json();

    if (courtId) {
      const currentMatch = data.find(
        (match: any) => match.PlayingAreaName === `Court ${courtId}`
      );

      if (!currentMatch) {
        throw new Error(`No match found for Court ${courtId}`);
      }

      return {
        id: currentMatch.id || "match-1",
        court: parseInt(courtId),
        startTime: currentMatch.DateTime,
        homeTeam: { id: "team-1", name: currentMatch.HomeTeam },
        awayTeam: { id: "team-2", name: currentMatch.AwayTeam },
      };
    }

    return data;
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