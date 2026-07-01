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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      daily_question_answers: {
        Row: {
          answered_at: string
          id: string
          is_correct: boolean
          question_date: string
          user_id: string
        }
        Insert: {
          answered_at?: string
          id?: string
          is_correct: boolean
          question_date: string
          user_id: string
        }
        Update: {
          answered_at?: string
          id?: string
          is_correct?: boolean
          question_date?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_questions: {
        Row: {
          correct_index: number
          created_at: string
          date: string
          explanation: string
          id: string
          options: Json
          question: string
        }
        Insert: {
          correct_index: number
          created_at?: string
          date: string
          explanation: string
          id?: string
          options: Json
          question: string
        }
        Update: {
          correct_index?: number
          created_at?: string
          date?: string
          explanation?: string
          id?: string
          options?: Json
          question?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      holdings: {
        Row: {
          avg_cost: number
          id: string
          name: string | null
          shares: number
          ticker: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_cost?: number
          id?: string
          name?: string | null
          shares?: number
          ticker: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_cost?: number
          id?: string
          name?: string | null
          shares?: number
          ticker?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leaderboard_snapshots: {
        Row: {
          rank: number
          return_pct: number
          snapshot_date: string
          user_id: string
        }
        Insert: {
          rank: number
          return_pct: number
          snapshot_date?: string
          user_id: string
        }
        Update: {
          rank?: number
          return_pct?: number
          snapshot_date?: string
          user_id?: string
        }
        Relationships: []
      }
      news_insights: {
        Row: {
          created_at: string
          headline: string
          headline_hash: string
          id: string
          insight: string
        }
        Insert: {
          created_at?: string
          headline: string
          headline_hash: string
          id?: string
          insight: string
        }
        Update: {
          created_at?: string
          headline?: string
          headline_hash?: string
          id?: string
          insight?: string
        }
        Relationships: []
      }
      news_reads: {
        Row: {
          created_at: string
          read_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          read_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          read_date?: string
          user_id?: string
        }
        Relationships: []
      }
      news_translations: {
        Row: {
          content_hash: string
          created_at: string
          lang: string
          translated_text: string
        }
        Insert: {
          content_hash: string
          created_at?: string
          lang: string
          translated_text: string
        }
        Update: {
          content_hash?: string
          created_at?: string
          lang?: string
          translated_text?: string
        }
        Relationships: []
      }
      notification_prefs: {
        Row: {
          daily_summary: boolean
          friend_alerts: boolean
          news_reminder: boolean
          push_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          daily_summary?: boolean
          friend_alerts?: boolean
          news_reminder?: boolean
          push_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          daily_summary?: boolean
          friend_alerts?: boolean
          news_reminder?: boolean
          push_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          category: string
          created_at: string
          id: string
          priority: number
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          category: string
          created_at?: string
          id?: string
          priority: number
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          priority?: number
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      price_cache: {
        Row: {
          change_pct: number | null
          fetched_at: string
          prev_close: number | null
          price: number
          source: string | null
          ticker: string
        }
        Insert: {
          change_pct?: number | null
          fetched_at?: string
          prev_close?: number | null
          price: number
          source?: string | null
          ticker: string
        }
        Update: {
          change_pct?: number | null
          fetched_at?: string
          prev_close?: number | null
          price?: number
          source?: string | null
          ticker?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          favorite_referente_id: string | null
          friend_code: string
          id: string
          is_portfolio_public: boolean
          is_premium: boolean
          last_reset_at: string | null
          name_changed_at: string | null
          onboarded: boolean
          starting_balance: number | null
          stripe_customer_id: string | null
          username: string | null
          wallet_cash: number | null
          wallet_starting: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          favorite_referente_id?: string | null
          friend_code: string
          id: string
          is_portfolio_public?: boolean
          is_premium?: boolean
          last_reset_at?: string | null
          name_changed_at?: string | null
          onboarded?: boolean
          starting_balance?: number | null
          stripe_customer_id?: string | null
          username?: string | null
          wallet_cash?: number | null
          wallet_starting?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          favorite_referente_id?: string | null
          friend_code?: string
          id?: string
          is_portfolio_public?: boolean
          is_premium?: boolean
          last_reset_at?: string | null
          name_changed_at?: string | null
          onboarded?: boolean
          starting_balance?: number | null
          stripe_customer_id?: string | null
          username?: string | null
          wallet_cash?: number | null
          wallet_starting?: number | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          executed_at: string
          id: string
          name: string | null
          price: number | null
          shares: number | null
          ticker: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          executed_at?: string
          id?: string
          name?: string | null
          price?: number | null
          shares?: number | null
          ticker: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          executed_at?: string
          id?: string
          name?: string | null
          price?: number | null
          shares?: number | null
          ticker?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_reports: {
        Row: {
          content: Json
          created_at: string
          id: string
          week_label: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          week_label: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          week_label?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_friend_code: { Args: never; Returns: string }
      get_global_leaderboard_profiles: {
        Args: never
        Returns: {
          display_name: string
          friend_code: string
          id: string
          is_portfolio_public: boolean
          is_premium: boolean
          starting_balance: number
          username: string
          wallet_cash: number
          wallet_starting: number
        }[]
      }
      get_leaderboard_profiles: {
        Args: { _ids: string[] }
        Returns: {
          display_name: string
          friend_code: string
          id: string
          is_portfolio_public: boolean
          is_premium: boolean
          starting_balance: number
          username: string
          wallet_cash: number
          wallet_starting: number
        }[]
      }
      is_display_name_taken: {
        Args: { _exclude_id: string; _name: string }
        Returns: boolean
      }
      lookup_profile_by_friend_code: {
        Args: { _code: string }
        Returns: {
          avatar_url: string
          display_name: string
          friend_code: string
          id: string
          username: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
