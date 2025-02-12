
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
  match_status: 'pending' | 'in_progress' | 'completed';
  home_total_points?: number;
  away_total_points?: number;
  home_sets_won?: number;
  away_sets_won?: number;
  home_bonus_points?: number;
  away_bonus_points?: number;
}
