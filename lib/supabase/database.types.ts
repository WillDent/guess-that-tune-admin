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
      activity_logs: {
        Row: {
          action_type: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          id: string
          user_id: string | null
          error_type: string
          playlist_id: string | null
          error_message: string
          timestamp: string | null
          device_info: Json | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          error_type: string
          playlist_id?: string | null
          error_message: string
          timestamp?: string | null
          device_info?: Json | null
        }
        Update: {
          id?: string
          user_id?: string | null
          error_type?: string
          playlist_id?: string | null
          error_message?: string
          timestamp?: string | null
          device_info?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "error_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "error_logs_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "question_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          question_set_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_set_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_set_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_question_set_id_fkey"
            columns: ["question_set_id"]
            isOneToOne: false
            referencedRelation: "question_sets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      game_participants: {
        Row: {
          answers: Json | null
          finished_at: string | null
          game_id: string
          guest_name: string | null
          id: string
          joined_at: string
          score: number | null
          user_id: string | null
        }
        Insert: {
          answers?: Json | null
          finished_at?: string | null
          game_id: string
          guest_name?: string | null
          id?: string
          joined_at?: string
          score?: number | null
          user_id?: string | null
        }
        Update: {
          answers?: Json | null
          finished_at?: string | null
          game_id?: string
          guest_name?: string | null
          id?: string
          joined_at?: string
          score?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_participants_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          code: string | null
          created_at: string
          ended_at: string | null
          game_mode: string
          host_user_id: string | null
          id: string
          max_players: number | null
          name: string
          question_set_id: string
          settings: Json | null
          started_at: string | null
          status: string
          time_limit: number | null
        }
        Insert: {
          code?: string | null
          created_at?: string
          ended_at?: string | null
          game_mode?: string
          host_user_id?: string | null
          id?: string
          max_players?: number | null
          name: string
          question_set_id: string
          settings?: Json | null
          started_at?: string | null
          status?: string
          time_limit?: number | null
        }
        Update: {
          code?: string | null
          created_at?: string
          ended_at?: string | null
          game_mode?: string
          host_user_id?: string | null
          id?: string
          max_players?: number | null
          name?: string
          question_set_id?: string
          settings?: Json | null
          started_at?: string | null
          status?: string
          time_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "games_host_user_id_fkey"
            columns: ["host_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_question_set_id_fkey"
            columns: ["question_set_id"]
            isOneToOne: false
          referencedRelation: "question_sets"
          referencedColumns: ["id"]
        },
      ]
      }
      game_results: {
        Row: {
          id: string
          user_id: string
          playlist_id: string
          correct_tracks: number
          total_tracks: number
          completion_time: number
          perfect_score: boolean
          score_awarded: number
          xp_awarded: number
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          playlist_id: string
          correct_tracks: number
          total_tracks: number
          completion_time: number
          perfect_score: boolean
          score_awarded: number
          xp_awarded: number
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          playlist_id?: string
          correct_tracks?: number
          total_tracks?: number
          completion_time?: number
          perfect_score?: boolean
          score_awarded?: number
          xp_awarded?: number
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_results_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
          referencedRelation: "question_sets"
          referencedColumns: ["id"]
        },
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          created_at: string | null
          is_read: boolean | null
          data: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          created_at?: string | null
          is_read?: boolean | null
          data?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          created_at?: string | null
          is_read?: boolean | null
          data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      question_set_categories: {
        Row: {
          category_id: string
          created_at: string | null
          question_set_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          question_set_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          question_set_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_set_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_set_categories_question_set_id_fkey"
            columns: ["question_set_id"]
            isOneToOne: false
            referencedRelation: "question_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      question_sets: {
        Row: {
          artwork_url: string | null
          created_at: string
          description: string | null
          difficulty: string
          id: string
          is_public: boolean | null
          name: string
          play_count: number
          question_count: number
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          artwork_url?: string | null
          created_at?: string
          description?: string | null
          difficulty: string
          id?: string
          is_public?: boolean | null
          name: string
          play_count?: number
          question_count?: number
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          artwork_url?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string
          id?: string
          is_public?: boolean | null
          name?: string
          play_count?: number
          question_count?: number
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_sets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          correct_song_album: string | null
          correct_song_artist: string
          correct_song_artwork_url: string | null
          correct_song_id: string
          correct_song_name: string
          correct_song_preview_url: string | null
          created_at: string
          detractors: Json
          id: string
          order_index: number
          question_set_id: string
        }
        Insert: {
          correct_song_album?: string | null
          correct_song_artist: string
          correct_song_artwork_url?: string | null
          correct_song_id: string
          correct_song_name: string
          correct_song_preview_url?: string | null
          created_at?: string
          detractors?: Json
          id?: string
          order_index: number
          question_set_id: string
        }
        Update: {
          correct_song_album?: string | null
          correct_song_artist?: string
          correct_song_artwork_url?: string | null
          correct_song_id?: string
          correct_song_name?: string
          correct_song_preview_url?: string | null
          created_at?: string
          detractors?: Json
          id?: string
          order_index?: number
          question_set_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_question_set_id_fkey"
            columns: ["question_set_id"]
            isOneToOne: false
            referencedRelation: "question_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string
          experience: number | null
          id: string
          level: number | null
          role: string | null
          status: string | null
          total_score: number | null
          suspended_at: string | null
          suspended_by: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          experience?: number | null
          id: string
          level?: number | null
          role?: string | null
          status?: string | null
          total_score?: number | null
          suspended_at?: string | null
          suspended_by?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          experience?: number | null
          id?: string
          level?: number | null
          role?: string | null
          status?: string | null
          total_score?: number | null
          suspended_at?: string | null
          suspended_by?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_suspended_by_fkey"
            columns: ["suspended_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_question_set_with_questions: {
        Args: { set_id: string }
        Returns: Json
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      increment_playlist_stats: {
        Args: {
          playlist_id: string
          total_plays_inc: number
          unique_players_inc: number
        }
        Returns: unknown
      }
      search_question_sets: {
        Args: { search_term: string }
        Returns: {
          created_at: string
          description: string | null
          difficulty: string
          id: string
          is_public: boolean | null
          name: string
          play_count: number
          question_count: number
          tags: string[] | null
          updated_at: string
          user_id: string
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
