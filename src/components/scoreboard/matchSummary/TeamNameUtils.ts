
import { supabase } from "@/integrations/supabase/client";

// Helper function to fetch or extract team names
export const getTeamName = async (matchId: string, isHome: boolean) => {
  // If the match is local (offline pending score), parse the team names from the matchId
  if (matchId.startsWith("local-")) {
    try {
      // Expected format (example): 
      // "local-04031800008_YOUGOTSERVED_CHICKENJOE'S-1741166685771"
      //
      // Parse the team names from the matchId:
      // 1. Remove the "local-" prefix
      const withoutLocal = matchId.substring(6);
      // 2. Split the remaining string by the dash "-" to separate the details from the timestamp
      const dashParts = withoutLocal.split("-");
      
      if (dashParts.length >= 1) {
        // The first part should contain a code and the team names joined by underscores
        const details = dashParts[0];
        const underscoreParts = details.split("_");
        
        // Parse team names - expected format: <date/time code>_<homeTeam>_<awayTeam>
        if (underscoreParts.length >= 3) {
          // Extract team names and format them with spaces
          const homeTeam = underscoreParts[1].replace(/([A-Z])/g, " $1").trim();
          const awayTeam = underscoreParts[2].replace(/([A-Z])/g, " $1").trim();
          
          console.log(`Extracted team names from local ID: ${homeTeam} vs ${awayTeam}`);
          return isHome ? homeTeam : awayTeam;
        }
      }
      
      console.log(`Failed to parse team name from local match ID: ${matchId}`);
      return isHome ? "Home Team" : "Away Team";
    } catch (error) {
      console.error(`Error parsing team name from local match ID ${matchId}:`, error);
      return isHome ? "Home Team" : "Away Team";
    }
  }

  // For non-local matches, query Supabase
  try {
    const { data: matchData, error } = await supabase
      .from("matches_v2")
      .select(isHome ? "home_team_name" : "away_team_name")
      .eq("id", matchId)
      .maybeSingle();

    if (error) {
      console.error("Supabase error fetching team name:", error);
    }

    return matchData ? matchData[isHome ? "home_team_name" : "away_team_name"] : isHome ? "Home Team" : "Away Team";
  } catch (error) {
    console.error(`Error fetching team name for ${matchId}:`, error);
    return isHome ? "Home Team" : "Away Team";
  }
};
