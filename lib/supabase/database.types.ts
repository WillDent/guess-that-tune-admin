export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action_type: string
          created_at: string | null
          details: Json
          id: string
          ip_address: unknown
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          details: Json
          id?: string
          ip_address?: unknown
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          details?: Json
          id?: string
          ip_address?: unknown
          user_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string
          created_at: string | null
          icon: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string
          created_at?: string | null
          icon?: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          icon?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          context: Json | null
          created_at: string | null
          error_message: string
          error_type: string
          id: string
          stack_trace: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          error_message: string
          error_type: string
          id?: string
          stack_trace?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          error_message?: string
          error_type?: string
          id?: string
          stack_trace?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          question_set_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          question_set_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          question_set_id?: string
          user_id?: string
        }
        Relationships: []
      }
      game_participants: {
        Row: {
          current_score: number | null
          game_id: string
          id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          current_score?: number | null
          game_id: string
          id?: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          current_score?: number | null
          game_id?: string
          id?: string
          joined_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      game_results: {
        Row: {
          correct_answers: number
          game_id: string
          id: string
          played_at: string | null
          total_questions: number
          user_id: string
        }
        Insert: {
          correct_answers: number
          game_id: string
          id?: string
          played_at?: string | null
          total_questions: number
          user_id: string
        }
        Update: {
          correct_answers?: number
          game_id?: string
          id?: string
          played_at?: string | null
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      games: {
        Row: {
          created_at: string | null
          game_code: string
          host_id: string
          id: string
          question_set_id: string
          status: string
        }
        Insert: {
          created_at?: string | null
          game_code: string
          host_id: string
          id?: string
          question_set_id: string
          status?: string
        }
        Update: {
          created_at?: string | null
          game_code?: string
          host_id?: string
          id?: string
          question_set_id?: string
          status?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      question_set_categories: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          question_set_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          question_set_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          question_set_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_set_categories_category_id_fkey"
            columns: ["category_id"]
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_set_categories_question_set_id_fkey"
            columns: ["question_set_id"]
            referencedRelation: "question_sets"
            referencedColumns: ["id"]
          }
        ]
      }
      question_sets: {
        Row: {
          artwork_url: string | null
          created_at: string | null
          description: string | null
          difficulty: string
          game_type: string
          id: string
          is_public: boolean | null
          metadata: Json | null
          name: string
          play_count: number | null
          question_count: number | null
          state: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          artwork_url?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string
          game_type?: string
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          name: string
          play_count?: number | null
          question_count?: number | null
          state?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          artwork_url?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: string
          game_type?: string
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          name?: string
          play_count?: number | null
          question_count?: number | null
          state?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_answer: string
          created_at: string | null
          id: string
          metadata: Json | null
          order_index: number | null
          question: string
          question_set_id: string
          type: string
          wrong_answers: string[]
        }
        Insert: {
          correct_answer: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          order_index?: number | null
          question: string
          question_set_id: string
          type: string
          wrong_answers: string[]
        }
        Update: {
          correct_answer?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          order_index?: number | null
          question?: string
          question_set_id?: string
          type?: string
          wrong_answers?: string[]
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}