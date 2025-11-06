export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
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
      bookings: {
        Row: {
          booking_date: string
          booking_type: string | null
          court_number: string | null
          created_at: string
          customer_id: string | null
          customer_name: string
          email: string | null
          end_time: string
          id: string
          invoice_sent: boolean | null
          is_recurring: boolean | null
          notes: string | null
          parent_booking_id: string | null
          payment_type: string | null
          phone: string | null
          player_count: number | null
          quoted_cost: number | null
          recurrence_count: number | null
          recurrence_end_date: string | null
          recurrence_frequency: string | null
          sms_reminder_sent: boolean | null
          sms_sent_at: string | null
          sms_status: string | null
          staff_assigned: string | null
          staff_members: string[] | null
          start_time: string
          updated_at: string
        }
        Insert: {
          booking_date: string
          booking_type?: string | null
          court_number?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name: string
          email?: string | null
          end_time: string
          id?: string
          invoice_sent?: boolean | null
          is_recurring?: boolean | null
          notes?: string | null
          parent_booking_id?: string | null
          payment_type?: string | null
          phone?: string | null
          player_count?: number | null
          quoted_cost?: number | null
          recurrence_count?: number | null
          recurrence_end_date?: string | null
          recurrence_frequency?: string | null
          sms_reminder_sent?: boolean | null
          sms_sent_at?: string | null
          sms_status?: string | null
          staff_assigned?: string | null
          staff_members?: string[] | null
          start_time: string
          updated_at?: string
        }
        Update: {
          booking_date?: string
          booking_type?: string | null
          court_number?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          email?: string | null
          end_time?: string
          id?: string
          invoice_sent?: boolean | null
          is_recurring?: boolean | null
          notes?: string | null
          parent_booking_id?: string | null
          payment_type?: string | null
          phone?: string | null
          player_count?: number | null
          quoted_cost?: number | null
          recurrence_count?: number | null
          recurrence_end_date?: string | null
          recurrence_frequency?: string | null
          sms_reminder_sent?: boolean | null
          sms_sent_at?: string | null
          sms_status?: string | null
          staff_assigned?: string | null
          staff_members?: string[] | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_parent_booking_id_fkey"
            columns: ["parent_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_flow_entries: {
        Row: {
          cash_sales_total: number
          created_at: string
          date: string
          day_of_week: string
          difference: number
          duty_report_cost: number
          duty_report_payments: number
          eftpos_total: number
          expected_end_amount: number
          id: string
          notes: string | null
          shift_end_cash: number
          shift_start_cash: number
          total_sales: number
          updated_at: string
        }
        Insert: {
          cash_sales_total?: number
          created_at?: string
          date: string
          day_of_week: string
          difference?: number
          duty_report_cost?: number
          duty_report_payments?: number
          eftpos_total?: number
          expected_end_amount?: number
          id?: string
          notes?: string | null
          shift_end_cash?: number
          shift_start_cash?: number
          total_sales?: number
          updated_at?: string
        }
        Update: {
          cash_sales_total?: number
          created_at?: string
          date?: string
          day_of_week?: string
          difference?: number
          duty_report_cost?: number
          duty_report_payments?: number
          eftpos_total?: number
          expected_end_amount?: number
          id?: string
          notes?: string | null
          shift_end_cash?: number
          shift_start_cash?: number
          total_sales?: number
          updated_at?: string
        }
        Relationships: []
      }
      cash_flow_records: {
        Row: {
          cash_collected: number
          created_at: string
          date: string
          day: string
          difference: number
          eftpos_collected: number
          expected_total: number
          id: string
          notes: string | null
          updated_at: string
          week: string
        }
        Insert: {
          cash_collected?: number
          created_at?: string
          date: string
          day: string
          difference?: number
          eftpos_collected?: number
          expected_total?: number
          id?: string
          notes?: string | null
          updated_at?: string
          week: string
        }
        Update: {
          cash_collected?: number
          created_at?: string
          date?: string
          day?: string
          difference?: number
          eftpos_collected?: number
          expected_total?: number
          id?: string
          notes?: string | null
          updated_at?: string
          week?: string
        }
        Relationships: []
      }
      clubs: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      court_scores: {
        Row: {
          court_number: number
          created_at: string
          id: string
          team1_score: number
          team2_score: number
          updated_at: string
        }
        Insert: {
          court_number: number
          created_at?: string
          id?: string
          team1_score?: number
          team2_score?: number
          updated_at?: string
        }
        Update: {
          court_number?: number
          created_at?: string
          id?: string
          team1_score?: number
          team2_score?: number
          updated_at?: string
        }
        Relationships: []
      }
      court_status: {
        Row: {
          court_number: number
          created_at: string | null
          id: string
          is_connected: boolean | null
          last_error: string | null
          last_heartbeat: string | null
          last_sync_time: string | null
          updated_at: string | null
        }
        Insert: {
          court_number: number
          created_at?: string | null
          id?: string
          is_connected?: boolean | null
          last_error?: string | null
          last_heartbeat?: string | null
          last_sync_time?: string | null
          updated_at?: string | null
        }
        Update: {
          court_number?: number
          created_at?: string | null
          id?: string
          is_connected?: boolean | null
          last_error?: string | null
          last_heartbeat?: string | null
          last_sync_time?: string | null
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
      customers: {
        Row: {
          background_color: string
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          background_color?: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          background_color?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      divider_images: {
        Row: {
          created_at: string | null
          file_path: string
          id: string
        }
        Insert: {
          created_at?: string | null
          file_path: string
          id?: string
        }
        Update: {
          created_at?: string | null
          file_path?: string
          id?: string
        }
        Relationships: []
      }
      division_colors: {
        Row: {
          color_classes: string
          created_at: string
          division_name: string
          id: string
          updated_at: string
        }
        Insert: {
          color_classes: string
          created_at?: string
          division_name: string
          id?: string
          updated_at?: string
        }
        Update: {
          color_classes?: string
          created_at?: string
          division_name?: string
          id?: string
          updated_at?: string
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
      email_templates: {
        Row: {
          booking_card_html: string
          created_at: string
          footer_html: string
          header_html: string
          id: string
          styles_css: string
          subject_template: string
          template_type: string
          updated_at: string
        }
        Insert: {
          booking_card_html: string
          created_at?: string
          footer_html: string
          header_html: string
          id?: string
          styles_css: string
          subject_template: string
          template_type: string
          updated_at?: string
        }
        Update: {
          booking_card_html?: string
          created_at?: string
          footer_html?: string
          header_html?: string
          id?: string
          styles_css?: string
          subject_template?: string
          template_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          end_time: string
          event_date: string
          event_name: string
          event_type: string | null
          id: string
          location: string | null
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time: string
          event_date: string
          event_name: string
          event_type?: string | null
          id?: string
          location?: string | null
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string
          event_date?: string
          event_name?: string
          event_type?: string | null
          id?: string
          location?: string | null
          start_time?: string
          updated_at?: string
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
      frisat_social_cashflow: {
        Row: {
          cash_end: number
          cash_start: number
          created_at: string | null
          date: string
          difference: number
          id: string
          neo_pos_cash: number
          neo_pos_eftpos: number
          neo_pos_total: number
          notes: string | null
          players: number
          staff_member: string
          updated_at: string | null
        }
        Insert: {
          cash_end: number
          cash_start: number
          created_at?: string | null
          date?: string
          difference: number
          id?: string
          neo_pos_cash?: number
          neo_pos_eftpos?: number
          neo_pos_total: number
          notes?: string | null
          players: number
          staff_member: string
          updated_at?: string | null
        }
        Update: {
          cash_end?: number
          cash_start?: number
          created_at?: string | null
          date?: string
          difference?: number
          id?: string
          neo_pos_cash?: number
          neo_pos_eftpos?: number
          neo_pos_total?: number
          notes?: string | null
          players?: number
          staff_member?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      league_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          league_id: string
          name: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          league_id: string
          name: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          league_id?: string
          name?: string
        }
        Relationships: []
      }
      league_notes: {
        Row: {
          created_at: string | null
          date: string
          day_context: string | null
          id: string
          note: string
          priority: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string
          day_context?: string | null
          id?: string
          note: string
          priority: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          day_context?: string | null
          id?: string
          note?: string
          priority?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      match_data_v2: {
        Row: {
          away_aces: number | null
          away_blocks: number | null
          away_bonus_points: number | null
          away_result: string | null
          away_team_name: string
          away_total_match_points: number | null
          away_total_points: number | null
          court_number: number
          created_at: string | null
          division: string | null
          fixture_start_time: string | null
          has_final_score: boolean | null
          home_aces: number | null
          home_blocks: number | null
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
          away_aces?: number | null
          away_blocks?: number | null
          away_bonus_points?: number | null
          away_result?: string | null
          away_team_name: string
          away_total_match_points?: number | null
          away_total_points?: number | null
          court_number: number
          created_at?: string | null
          division?: string | null
          fixture_start_time?: string | null
          has_final_score?: boolean | null
          home_aces?: number | null
          home_blocks?: number | null
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
          away_aces?: number | null
          away_blocks?: number | null
          away_bonus_points?: number | null
          away_result?: string | null
          away_team_name?: string
          away_total_match_points?: number | null
          away_total_points?: number | null
          court_number?: number
          created_at?: string | null
          division?: string | null
          fixture_start_time?: string | null
          has_final_score?: boolean | null
          home_aces?: number | null
          home_blocks?: number | null
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
          fixture_start_time: string | null
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
          fixture_start_time?: string | null
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
          fixture_start_time?: string | null
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
      notice_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      player_pricing: {
        Row: {
          created_at: string
          day_of_week: string
          four_players: number
          id: string
          six_players: number
          two_players: number
        }
        Insert: {
          created_at?: string
          day_of_week: string
          four_players?: number
          id?: string
          six_players?: number
          two_players?: number
        }
        Update: {
          created_at?: string
          day_of_week?: string
          four_players?: number
          id?: string
          six_players?: number
          two_players?: number
        }
        Relationships: []
      }
      shopping_items: {
        Row: {
          created_at: string
          id: string
          name: string
          purchased: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          purchased?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          purchased?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_media_counts: {
        Row: {
          follower_count: number
          id: string
          platform: string
          updated_at: string | null
        }
        Insert: {
          follower_count?: number
          id?: string
          platform: string
          updated_at?: string | null
        }
        Update: {
          follower_count?: number
          id?: string
          platform?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      staff_members: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
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
      team_player_counts: {
        Row: {
          created_at: string
          date: string
          day_of_week: string
          id: string
          player_count: number
          team_id: string
          updated_at: string
          week: string
        }
        Insert: {
          created_at?: string
          date: string
          day_of_week: string
          id?: string
          player_count?: number
          team_id: string
          updated_at?: string
          week: string
        }
        Update: {
          created_at?: string
          date?: string
          day_of_week?: string
          id?: string
          player_count?: number
          team_id?: string
          updated_at?: string
          week?: string
        }
        Relationships: []
      }
      team_preference_notes: {
        Row: {
          contact_number: string | null
          created_at: string | null
          date: string
          day_context: string | null
          experience_level: string | null
          id: string
          note: string
          permanent_days: string[] | null
          team_id: string
          team_name: string
          umpire_type: string | null
          updated_at: string | null
        }
        Insert: {
          contact_number?: string | null
          created_at?: string | null
          date?: string
          day_context?: string | null
          experience_level?: string | null
          id?: string
          note: string
          permanent_days?: string[] | null
          team_id: string
          team_name: string
          umpire_type?: string | null
          updated_at?: string | null
        }
        Update: {
          contact_number?: string | null
          created_at?: string | null
          date?: string
          day_context?: string | null
          experience_level?: string | null
          id?: string
          note?: string
          permanent_days?: string[] | null
          team_id?: string
          team_name?: string
          umpire_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      team_selections: {
        Row: {
          created_at: string
          day_of_week: string
          id: string
          is_not_playing: boolean | null
          is_playing: boolean | null
          notes: string | null
          summer25_signup: boolean | null
          team_id: string
          team_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: string
          id?: string
          is_not_playing?: boolean | null
          is_playing?: boolean | null
          notes?: string | null
          summer25_signup?: boolean | null
          team_id: string
          team_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: string
          id?: string
          is_not_playing?: boolean | null
          is_playing?: boolean | null
          notes?: string | null
          summer25_signup?: boolean | null
          team_id?: string
          team_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_shared_players: {
        Row: {
          created_at: string | null
          day_context: string | null
          id: string
          is_deleted: boolean | null
          notes: string | null
          team_original_ids: string[] | null
          teams: string[]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_context?: string | null
          id?: string
          is_deleted?: boolean | null
          notes?: string | null
          team_original_ids?: string[] | null
          teams: string[]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_context?: string | null
          id?: string
          is_deleted?: boolean | null
          notes?: string | null
          team_original_ids?: string[] | null
          teams?: string[]
          updated_at?: string | null
        }
        Relationships: []
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
            referencedRelation: "teams_v2"
            referencedColumns: ["id"]
          },
        ]
      }
      team_time_preferences: {
        Row: {
          created_at: string | null
          day_context: string
          id: string
          preference_type: Database["public"]["Enums"]["time_preference_type"]
          team_id: string
          team_name: string
          time_slot: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_context: string
          id?: string
          preference_type: Database["public"]["Enums"]["time_preference_type"]
          team_id: string
          team_name: string
          time_slot: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_context?: string
          id?: string
          preference_type?: Database["public"]["Enums"]["time_preference_type"]
          team_id?: string
          team_name?: string
          time_slot?: string
          updated_at?: string | null
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
      timer_settings: {
        Row: {
          break_duration_seconds: number
          created_at: string | null
          id: string
          set_duration_minutes: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          break_duration_seconds?: number
          created_at?: string | null
          id?: string
          set_duration_minutes?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          break_duration_seconds?: number
          created_at?: string | null
          id?: string
          set_duration_minutes?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      timer_state: {
        Row: {
          court_number: number
          created_at: string
          id: string
          is_running: boolean | null
          seconds_remaining: number
          updated_at: string
        }
        Insert: {
          court_number: number
          created_at?: string
          id?: string
          is_running?: boolean | null
          seconds_remaining?: number
          updated_at?: string
        }
        Update: {
          court_number?: number
          created_at?: string
          id?: string
          is_running?: boolean | null
          seconds_remaining?: number
          updated_at?: string
        }
        Relationships: []
      }
      tv_notices: {
        Row: {
          background_color: string
          created_at: string | null
          display_order: number
          id: string
          text: string
          text_color: string
          updated_at: string | null
        }
        Insert: {
          background_color?: string
          created_at?: string | null
          display_order: number
          id?: string
          text: string
          text_color?: string
          updated_at?: string | null
        }
        Update: {
          background_color?: string
          created_at?: string | null
          display_order?: number
          id?: string
          text?: string
          text_color?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      umpire_assignments: {
        Row: {
          court_time_key: string
          created_at: string
          day: string
          id: string
          umpire_id: string
          updated_at: string
          week: string
        }
        Insert: {
          court_time_key: string
          created_at?: string
          day: string
          id?: string
          umpire_id: string
          updated_at?: string
          week: string
        }
        Update: {
          court_time_key?: string
          created_at?: string
          day?: string
          id?: string
          umpire_id?: string
          updated_at?: string
          week?: string
        }
        Relationships: []
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
        Insert: {
          away_bonus_points?: number | null
          away_result?: string | null
          away_team_name?: string | null
          away_total_match_points?: number | null
          away_total_points?: number | null
          court_number?: number | null
          division?: string | null
          has_final_score?: boolean | null
          home_bonus_points?: number | null
          home_result?: string | null
          home_team_name?: string | null
          home_total_match_points?: number | null
          home_total_points?: number | null
          id?: string | null
          is_active?: boolean | null
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
          away_result?: string | null
          away_team_name?: string | null
          away_total_match_points?: number | null
          away_total_points?: number | null
          court_number?: number | null
          division?: string | null
          has_final_score?: boolean | null
          home_bonus_points?: number | null
          home_result?: string | null
          home_team_name?: string | null
          home_total_match_points?: number | null
          home_total_points?: number | null
          id?: string | null
          is_active?: boolean | null
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
      team_standings: {
        Row: {
          bonus_points: number | null
          division: string | null
          losses: number | null
          matches_played: number | null
          points_percentage: number | null
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
      add_league_comment: {
        Args: { p_content: string; p_league_id: string; p_name: string }
        Returns: string
      }
      delete_league_comment: { Args: { p_id: string }; Returns: undefined }
      delete_team_shared_player: {
        Args: { entry_id: string }
        Returns: boolean
      }
      get_league_comments: {
        Args: { p_league_id: string }
        Returns: {
          content: string
          created_at: string
          id: string
          league_id: string
          name: string
        }[]
      }
      handle_match_data_update: {
        Args: {
          p_match_id: string
          p_set1_away_score: number
          p_set1_home_score: number
          p_set2_away_score: number
          p_set2_home_score: number
          p_set3_away_score: number
          p_set3_home_score: number
        }
        Returns: undefined
      }
      refresh_team_statistics_safe: { Args: never; Returns: undefined }
      update_league_comment: {
        Args: { p_content: string; p_id: string; p_name: string }
        Returns: undefined
      }
      update_match_scores: {
        Args: {
          p_match_id: string
          p_set1_away_score: number
          p_set1_home_score: number
          p_set2_away_score: number
          p_set2_home_score: number
          p_set3_away_score: number
          p_set3_home_score: number
        }
        Returns: undefined
      }
      update_player_pricing: {
        Args: {
          p_day_of_week: string
          p_four_players: number
          p_id: string
          p_six_players: number
          p_two_players: number
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      time_preference_type: ["good", "bad"],
      time_slot_type: ["1", "2", "3", "4", "5", "6", "7", "8"],
    },
  },
} as const
