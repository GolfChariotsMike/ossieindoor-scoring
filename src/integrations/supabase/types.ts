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
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: string
          id?: string
          league_url?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: string
          id?: string
          league_url?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
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
          home_bonus_points: number | null
          home_result: string | null
          home_team_name: string
          home_total_match_points: number | null
          home_total_points: number | null
          id: string
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
          home_bonus_points?: number | null
          home_result?: string | null
          home_team_name: string
          home_total_match_points?: number | null
          home_total_points?: number | null
          id?: string
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
          home_bonus_points?: number | null
          home_result?: string | null
          home_team_name?: string
          home_total_match_points?: number | null
          home_total_points?: number | null
          id?: string
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
      matches_v2: {
        Row: {
          away_team_id: string
          away_team_name: string
          court_number: number
          created_at: string | null
          division: string | null
          home_team_id: string
          home_team_name: string
          id: string
          match_code: string
          start_time: string | null
        }
        Insert: {
          away_team_id: string
          away_team_name: string
          court_number: number
          created_at?: string | null
          division?: string | null
          home_team_id: string
          home_team_name: string
          id?: string
          match_code: string
          start_time?: string | null
        }
        Update: {
          away_team_id?: string
          away_team_name?: string
          court_number?: number
          created_at?: string | null
          division?: string | null
          home_team_id?: string
          home_team_name?: string
          id?: string
          match_code?: string
          start_time?: string | null
        }
        Relationships: []
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
    }
    Views: {
      match_progress_view: {
        Row: {
          away_team_name: string | null
          court_number: number | null
          division: string | null
          has_final_score: boolean | null
          home_team_name: string | null
          id: string | null
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
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
