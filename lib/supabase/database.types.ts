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
      question_sets: {
        Row: {
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
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
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