export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_settings: {
        Row: {
          created_at: string | null
          id: string
          setting_name: string
          setting_value: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          setting_name: string
          setting_value: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          setting_name?: string
          setting_value?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      crash_logs: {
        Row: {
          browser_info: Json | null
          court_number: number | null
          created_at: string | null
          error_message: string
          error_stack: string | null
          error_type: string
          fixture_id: string | null
          id: string
          resolved: boolean | null
          url: string | null
        }
        Insert: {
          browser_info?: Json | null
          court_number?: number | null
          created_at?: string | null
          error_message: string
          error_stack?: string | null
          error_type: string
          fixture_id?: string | null
          id?: string
          resolved?: boolean | null
          url?: string | null
        }
        Update: {
          browser_info?: Json | null
          court_number?: number | null
          created_at?: string | null
          error_message?: string
          error_stack?: string | null
          error_type?: string
          fixture_id?: string | null
          id?: string
          resolved?: boolean | null
          url?: string | null
        }
        Relationships: []
      }
      divisions: {
        Row: {
          created_at: string | null
          day_of_week: string
          id: string
          league_url: string | null
          name: string
          season: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: string
          id?: string
          league_url?: string | null
          name: string
          season?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: string
          id?: string
          league_url?: string | null
          name?: string
          season?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fixture_settings: {
        Row: {
          courts_per_slot: number
          created_at: string | null
          id: string
          number_of_weeks: number
          season: string
          start_date: string
          time_slots: number
          updated_at: string | null
        }
        Insert: {
          courts_per_slot: number
          created_at?: string | null
          id?: string
          number_of_weeks: number
          season: string
          start_date: string
          time_slots: number
          updated_at?: string | null
        }
        Update: {
          courts_per_slot?: number
          created_at?: string | null
          id?: string
          number_of_weeks?: number
          season?: string
          start_date?: string
          time_slots?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      fixtures: {
        Row: {
          away_team_id: string
          court_number: number
          created_at: string | null
          division_id: string | null
          fixture_date: string
          home_team_id: string
          id: string
          round_number: number
          season: string
          time_slot: Database["public"]["Enums"]["time_slot_type"]
          updated_at: string | null
        }
        Insert: {
          away_team_id: string
          court_number: number
          created_at?: string | null
          division_id?: string | null
          fixture_date: string
          home_team_id: string
          id?: string
          round_number: number
          season: string
          time_slot: Database["public"]["Enums"]["time_slot_type"]
          updated_at?: string | null
        }
        Update: {
          away_team_id?: string
          court_number?: number
          created_at?: string | null
          division_id?: string | null
          fixture_date?: string
          home_team_id?: string
          id?: string
          round_number?: number
          season?: string
          time_slot?: Database["public"]["Enums"]["time_slot_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fixtures_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixtures_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fixtures_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      match_data_v2: {
        Row: {
          away_bonus_points: number | null
          away_result: string | null
          away_team_name: string
          away_total_match_points: number | null
          away_total_points: number | null
          court_number: number
          created_at: string | null
          division: string | null
          has_final_score: boolean | null
          home_bonus_points: number | null
          home_result: string | null
          home_team_name: string
          home_total_match_points: number | null
          home_total_points: number | null
          id: string
          is_active: boolean | null
          match_date: string | null
          match_id: string | null
          points_percentage: number | null
          set1_away_score: number | null
          set1_home_score: number | null
          set2_away_score: number | null
          set2_home_score: number | null
          set3_away_score: number | null
          set3_home_score: number | null
          updated_at: string | null
        }
        Insert: {
          away_bonus_points?: number | null
          away_result?: string | null
          away_team_name: string
          away_total_match_points?: number | null
          away_total_points?: number | null
          court_number: number
          created_at?: string | null
          division?: string | null
          has_final_score?: boolean | null
          home_bonus_points?: number | null
          home_result?: string | null
          home_team_name: string
          home_total_match_points?: number | null
          home_total_points?: number | null
          id?: string
          is_active?: boolean | null
          match_date?: string | null
          match_id?: string | null
          points_percentage?: number | null
          set1_away_score?: number | null
          set1_home_score?: number | null
          set2_away_score?: number | null
          set2_home_score?: number | null
          set3_away_score?: number | null
          set3_home_score?: number | null
          updated_at?: string | null
        }
        Update: {
          away_bonus_points?: number | null
          away_result?: string | null
          away_team_name?: string
          away_total_match_points?: number | null
          away_total_points?: number | null
          court_number?: number
          created_at?: string | null
          division?: string | null
          has_final_score?: boolean | null
          home_bonus_points?: number | null
          home_result?: string | null
          home_team_name?: string
          home_total_match_points?: number | null
          home_total_points?: number | null
          id?: string
          is_active?: boolean | null
          match_date?: string | null
          match_id?: string | null
          points_percentage?: number | null
          set1_away_score?: number | null
          set1_home_score?: number | null
          set2_away_score?: number | null
          set2_home_score?: number | null
          set3_away_score?: number | null
          set3_home_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_data_v2_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "match_progress_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_data_v2_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      match_history: {
        Row: {
          created_at: string | null
          id: string
          match_id: string
          set1_away_score: number | null
          set1_home_score: number | null
          set2_away_score: number | null
          set2_home_score: number | null
          set3_away_score: number | null
          set3_home_score: number | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          match_id: string
          set1_away_score?: number | null
          set1_home_score?: number | null
          set2_away_score?: number | null
          set2_home_score?: number | null
          set3_away_score?: number | null
          set3_home_score?: number | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          match_id?: string
          set1_away_score?: number | null
          set1_home_score?: number | null
          set2_away_score?: number | null
          set2_home_score?: number | null
          set3_away_score?: number | null
          set3_home_score?: number | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_history_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "match_progress_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_history_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      match_results: {
        Row: {
          away_bonus_points: number | null
          away_sets_won: number | null
          away_team_name: string
          away_total_points: number | null
          court_number: number
          created_at: string | null
          created_by: string | null
          division: string | null
          home_bonus_points: number | null
          home_sets_won: number | null
          home_team_name: string
          home_total_points: number | null
          id: string
          is_current_result: boolean | null
          match_date: string | null
          match_id: string
          set1_away_score: number | null
          set1_home_score: number | null
          set2_away_score: number | null
          set2_home_score: number | null
          set3_away_score: number | null
          set3_home_score: number | null
        }
        Insert: {
          away_bonus_points?: number | null
          away_sets_won?: number | null
          away_team_name: string
          away_total_points?: number | null
          court_number: number
          created_at?: string | null
          created_by?: string | null
          division?: string | null
          home_bonus_points?: number | null
          home_sets_won?: number | null
          home_team_name: string
          home_total_points?: number | null
          id?: string
          is_current_result?: boolean | null
          match_date?: string | null
          match_id: string
          set1_away_score?: number | null
          set1_home_score?: number | null
          set2_away_score?: number | null
          set2_home_score?: number | null
          set3_away_score?: number | null
          set3_home_score?: number | null
        }
        Update: {
          away_bonus_points?: number | null
          away_sets_won?: number | null
          away_team_name?: string
          away_total_points?: number | null
          court_number?: number
          created_at?: string | null
          created_by?: string | null
          division?: string | null
          home_bonus_points?: number | null
          home_sets_won?: number | null
          home_team_name?: string
          home_total_points?: number | null
          id?: string
          is_current_result?: boolean | null
          match_date?: string | null
          match_id?: string
          set1_away_score?: number | null
          set1_home_score?: number | null
          set2_away_score?: number | null
          set2_home_score?: number | null
          set3_away_score?: number | null
          set3_home_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "match_results_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "match_progress_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_results_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      matches_v2: {
        Row: {
          away_bonus_points: number | null
          away_sets_won: number | null
          away_team_id: string
          away_team_name: string
          away_total_points: number | null
          court_number: number
          created_at: string | null
          division: string | null
          home_bonus_points: number | null
          home_sets_won: number | null
          home_team_id: string
          home_team_name: string
          home_total_points: number | null
          id: string
          match_code: string
          match_status: string | null
          set1_away_score: number | null
          set1_home_score: number | null
          set2_away_score: number | null
          set2_home_score: number | null
          set3_away_score: number | null
          set3_home_score: number | null
          start_time: string | null
        }
        Insert: {
          away_bonus_points?: number | null
          away_sets_won?: number | null
          away_team_id: string
          away_team_name: string
          away_total_points?: number | null
          court_number: number
          created_at?: string | null
          division?: string | null
          home_bonus_points?: number | null
          home_sets_won?: number | null
          home_team_id: string
          home_team_name: string
          home_total_points?: number | null
          id?: string
          match_code: string
          match_status?: string | null
          set1_away_score?: number | null
          set1_home_score?: number | null
          set2_away_score?: number | null
          set2_home_score?: number | null
          set3_away_score?: number | null
          set3_home_score?: number | null
          start_time?: string | null
        }
        Update: {
          away_bonus_points?: number | null
          away_sets_won?: number | null
          away_team_id?: string
          away_team_name?: string
          away_total_points?: number | null
          court_number?: number
          created_at?: string | null
          division?: string | null
          home_bonus_points?: number | null
          home_sets_won?: number | null
          home_team_id?: string
          home_team_name?: string
          home_total_points?: number | null
          id?: string
          match_code?: string
          match_status?: string | null
          set1_away_score?: number | null
          set1_home_score?: number | null
          set2_away_score?: number | null
          set2_home_score?: number | null
          set3_away_score?: number | null
          set3_home_score?: number | null
          start_time?: string | null
        }
        Relationships: []
      }
      team_clashes: {
        Row: {
          clash_team_id: string | null
          created_at: string | null
          id: string
          notes: string | null
          reason: string | null
          team_id: string | null
        }
        Insert: {
          clash_team_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          reason?: string | null
          team_id?: string | null
        }
        Update: {
          clash_team_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          reason?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_clashes_clash_team_id_fkey"
            columns: ["clash_team_id"]
            isOneToOne: false
            referencedRelation: "teams_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_clashes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      team_statistics: {
        Row: {
          bonus_points: number | null
          created_at: string | null
          division_id: string | null
          draws: number | null
          games_played: number | null
          id: string
          losses: number | null
          points_against: number | null
          points_for: number | null
          points_percentage: number | null
          season: string | null
          team_id: string
          total_points: number | null
          updated_at: string | null
          wins: number | null
        }
        Insert: {
          bonus_points?: number | null
          created_at?: string | null
          division_id?: string | null
          draws?: number | null
          games_played?: number | null
          id?: string
          losses?: number | null
          points_against?: number | null
          points_for?: number | null
          points_percentage?: number | null
          season?: string | null
          team_id: string
          total_points?: number | null
          updated_at?: string | null
          wins?: number | null
        }
        Update: {
          bonus_points?: number | null
          created_at?: string | null
          division_id?: string | null
          draws?: number | null
          games_played?: number | null
          id?: string
          losses?: number | null
          points_against?: number | null
          points_for?: number | null
          points_percentage?: number | null
          season?: string | null
          team_id?: string
          total_points?: number | null
          updated_at?: string | null
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_team_statistics_team"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "teams_v2"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_statistics_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_statistics_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: true
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          division_id: string | null
          external_team_id: string | null
          id: string
          team_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          division_id?: string | null
          external_team_id?: string | null
          id?: string
          team_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          division_id?: string | null
          external_team_id?: string | null
          id?: string
          team_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      teams_v2: {
        Row: {
          cannot_play_after: string | null
          cannot_play_before: string | null
          created_at: string | null
          day_of_week: string
          division_id: string | null
          id: string
          notes: string | null
          preferred_time_slot: string | null
          season: string | null
          team_name: string
          updated_at: string | null
        }
        Insert: {
          cannot_play_after?: string | null
          cannot_play_before?: string | null
          created_at?: string | null
          day_of_week: string
          division_id?: string | null
          id?: string
          notes?: string | null
          preferred_time_slot?: string | null
          season?: string | null
          team_name: string
          updated_at?: string | null
        }
        Update: {
          cannot_play_after?: string | null
          cannot_play_before?: string | null
          created_at?: string | null
          day_of_week?: string
          division_id?: string | null
          id?: string
          notes?: string | null
          preferred_time_slot?: string | null
          season?: string | null
          team_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_v2_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "divisions"
            referencedColumns: ["id"]
          },
        ]
      }
      time_slot_preferences: {
        Row: {
          created_at: string | null
          id: string
          preference_type: Database["public"]["Enums"]["time_preference_type"]
          team_id: string
          time_slot: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          preference_type: Database["public"]["Enums"]["time_preference_type"]
          team_id: string
          time_slot: string
        }
        Update: {
          created_at?: string | null
          id?: string
          preference_type?: Database["public"]["Enums"]["time_preference_type"]
          team_id?: string
          time_slot?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_slot_preferences_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams_v2"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      match_progress_view: {
        Row: {
          away_bonus_points: number | null
          away_result: string | null
          away_team_name: string | null
          away_total_match_points: number | null
          away_total_points: number | null
          court_number: number | null
          division: string | null
          has_final_score: boolean | null
          home_bonus_points: number | null
          home_result: string | null
          home_team_name: string | null
          home_total_match_points: number | null
          home_total_points: number | null
          id: string | null
          is_active: boolean | null
          set1_away_score: number | null
          set1_home_score: number | null
          set2_away_score: number | null
          set2_home_score: number | null
          set3_away_score: number | null
          set3_home_score: number | null
          start_time: string | null
        }
        Relationships: []
      }
      team_standings: {
        Row: {
          bonus_points: number | null
          division: string | null
          losses: number | null
          matches_played: number | null
          points_percentage: number | null
          sets_won: number | null
          team_name: string | null
          total_points: number | null
          total_points_against: number | null
          total_points_for: number | null
          wins: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      handle_match_data_update: {
        Args: {
          p_match_id: string
          p_set1_home_score: number
          p_set1_away_score: number
          p_set2_home_score: number
          p_set2_away_score: number
          p_set3_home_score: number
          p_set3_away_score: number
        }
        Returns: undefined
      }
      refresh_team_statistics_safe: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_match_scores: {
        Args: {
          p_match_id: string
          p_set1_home_score: number
          p_set1_away_score: number
          p_set2_home_score: number
          p_set2_away_score: number
          p_set3_home_score: number
          p_set3_away_score: number
        }
        Returns: undefined
      }
    }
    Enums: {
      time_preference_type: "good" | "bad"
      time_slot_type: "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
