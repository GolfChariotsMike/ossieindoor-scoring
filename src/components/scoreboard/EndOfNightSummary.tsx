
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfDay, endOfDay } from "date-fns";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { LoadingSpinner } from "./LoadingSpinner";
import { Save, ArrowLeft } from "lucide-react";
import { getPendingScores } from "@/services/indexedDB";
import { processPendingScores } from "@/utils/matchDatabase";
import { disableForcedOfflineMode, isOffline } from "@/utils/offlineMode";

const getTeamName = async (matchId: string, isHome: boolean) => {
  if (matchId.startsWith("local-")) {
    try {
      const withoutLocal = matchId.substring(6);
      const dashParts = withoutLocal.split("-");
      
      if (dashParts.length >= 1) {
        const details = dashParts[0];
        const underscoreParts = details.split("_");
        
        if (underscoreParts.length >= 3) {
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

interface EndOfNightSummaryProps {
  courtId: string;
  onBack: () => void;
}

export const EndOfNightSummary = ({ courtId, onBack }: EndOfNightSummaryProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: matches, isLoading, refetch } = useQuery({
    queryKey: ["matches-summary", courtId],
    queryFn: async () => {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const dateParam = searchParams.get("date");

        const targetDate = dateParam ? new Date(dateParam) : new Date();
        const dayStart = startOfDay(targetDate);
        const dayEnd = endOfDay(targetDate);

        console.log("Fetching matches for:", {
          courtId,
          dateParam,
          targetDate,
          dayStart: dayStart.toISOString(),
          dayEnd: dayEnd.toISOString(),
        });

        const pendingScores = await getPendingScores();
        console.log("Found pending scores:", pendingScores.length);

        if (isOffline()) {
          console.log("Offline mode - showing only locally stored data");

          const localMatches = await Promise.all(
            pendingScores.map(async (score) => {
              const homeTeamName = await getTeamName(score.matchId, true);
              const awayTeamName = await getTeamName(score.matchId, false);

              return {
                id: score.matchId,
                match_id: score.matchId,
                match_date: score.timestamp,
                court_number: parseInt(courtId),
                division: "Local",
                home_team_name: homeTeamName,
                away_team_name: awayTeamName,
                set1_home_score: score.homeScores[0] || 0,
                set1_away_score: score.awayScores[0] || 0,
                set2_home_score: score.homeScores[1] || 0,
                set2_away_score: score.awayScores[1] || 0,
                set3_home_score: score.homeScores[2] || 0,
                set3_away_score: score.awayScores[2] || 0,
                is_active: true,
                has_final_score: false,
                home_total_points: score.homeScores.reduce((a, b) => a + b, 0),
                away_total_points: score.awayScores.reduce((a, b) => a + b, 0),
                home_bonus_points: 0,
                away_bonus_points: 0,
                home_total_match_points: 0,
                away_total_match_points: 0,
                points_percentage: 0,
                created_at: score.timestamp,
                updated_at: score.timestamp,
                home_result: "",
                away_result: "",
                fixture_start_time: null,
              };
            })
          );

          return localMatches;
        }

        const { data: existingMatches, error } = await supabase
          .from("match_data_v2")
          .select("*")
          .eq("court_number", parseInt(courtId))
          .eq("is_active", true)
          .gte("match_date", dayStart.toISOString())
          .lte("match_date", dayEnd.toISOString())
          .order("match_date", { ascending: true });

        if (error) {
          console.error("Error fetching matches:", error);
          throw error;
        }

        console.log("Total matches to display:", existingMatches.length);
        return existingMatches || [];
      } catch (error) {
        console.error("Error in match summary query:", error);
        toast({
          title: "Error loading matches",
          description: "There was a problem loading the match data. Please try again.",
          variant: "destructive",
        });
        return [];
      }
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-white p-6 transform rotate-180" style={{ transformOrigin: 'center center' }}>
      <div className="max-w-[1200px] mx-auto space-y-6 transform rotate-180" style={{ transformOrigin: 'center center' }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-2xl font-bold">Court {courtId} - End of Night Summary</h1>
          </div>
        </div>

        {matches && matches.length > 0 ? (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Time</TableHead>
                  <TableHead>Home Team</TableHead>
                  <TableHead className="text-center">Set 1</TableHead>
                  <TableHead className="text-center">Set 2</TableHead>
                  <TableHead className="text-center">Set 3</TableHead>
                  <TableHead>Away Team</TableHead>
                  <TableHead className="w-[100px] text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.map((match) => (
                  <TableRow key={match.id}>
                    <TableCell>{format(new Date(match.match_date), "HH:mm")}</TableCell>
                    <TableCell className="font-medium">{match.home_team_name}</TableCell>
                    <TableCell className="text-center">{match.set1_home_score} - {match.set1_away_score}</TableCell>
                    <TableCell className="text-center">{match.set2_home_score} - {match.set2_away_score}</TableCell>
                    <TableCell className="text-center">{match.set3_home_score} - {match.set3_away_score}</TableCell>
                    <TableCell className="font-medium">{match.away_team_name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">No matches recorded today.</div>
        )}
      </div>
    </div>
  );
};
