import type { Database } from '@/lib/supabase/database.types'

type Game = Database['public']['Tables']['games']['Row']
type QuestionSet = Database['public']['Tables']['question_sets']['Row']
type GameParticipant = Database['public']['Tables']['game_participants']['Row']

export interface GameWithDetails extends Game {
  question_set: Pick<QuestionSet, 'id' | 'name' | 'difficulty'>
  participants: GameParticipant[]
  participant_count?: number
}