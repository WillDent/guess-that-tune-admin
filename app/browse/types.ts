import type { Database } from '@/lib/supabase/database.types'

type QuestionSet = Database['public']['Tables']['question_sets']['Row']
type User = Database['public']['Tables']['users']['Row']

export interface PublicQuestionSet extends QuestionSet {
  user: Pick<User, 'id' | 'display_name' | 'email'>
  is_favorited?: boolean
  question_count: number
}

export type SortOption = 'newest' | 'popular' | 'alphabetical'
export type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard'