
export interface MatchScore {
  set1_home_score: number;
  set1_away_score: number;
  set2_home_score: number;
  set2_away_score: number;
  set3_home_score: number;
  set3_away_score: number;
}

export interface MatchProgressItem {
  id: string;
  start_time: string;
  court_number: number;
  division?: string;
  home_team_name: string;
  away_team_name: string;
  set1_home_score?: number;
  set1_away_score?: number;
  set2_home_score?: number;
  set2_away_score?: number;
  set3_home_score?: number;
  set3_away_score?: number;
  has_final_score: boolean;
  home_total_points?: number;
  away_total_points?: number;
  home_result?: string;
  away_result?: string;
  home_bonus_points?: number;
  away_bonus_points?: number;
  home_total_match_points?: number;
  away_total_match_points?: number;
  is_active: boolean;
}
