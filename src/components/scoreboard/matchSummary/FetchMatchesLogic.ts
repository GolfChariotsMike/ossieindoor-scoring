
import { QueryFunction } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay } from "date-fns";
import { getPendingScores } from "@/services/indexedDB";
import { isOffline } from "@/utils/offlineMode";
import { getTeamName } from "./TeamNameUtils";

export interface SummaryMatch {
  id: string;
  match_id: string;
  match_date: string;
  court_number: number;
  division: string;
  home_team_name: string;
  away_team_name: string;
  set1_home_score: number;
  set1_away_score: number;
  set2_home_score: number;
  set2_away_score: number;
  set3_home_score: number;
  set3_away_score: number;
  is_active: boolean;
  has_final_score: boolean;
  home_total_points: number;
  away_total_points: number;
  home_bonus_points: number;
  away_bonus_points: number;
  home_total_match_points: number;
  away_total_match_points: number;
  points_percentage: number;
  created_at: string;
  updated_at: string;
  home_result: string;
  away_result: string;
  fixture_start_time: string | null;
  [key: string]: any;
}

export const fetchMatchSummary: QueryFunction<SummaryMatch[], [string, string]> = async ({ queryKey }) => {
  const [_, courtId] = queryKey;
  
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

      // Improved team name extraction for local matches
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
    throw error;
  }
};
