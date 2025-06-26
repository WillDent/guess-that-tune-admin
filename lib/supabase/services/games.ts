import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type Game = Database['public']['Tables']['games']['Row']
type GameInsert = Database['public']['Tables']['games']['Insert']
type GameUpdate = Database['public']['Tables']['games']['Update']
type GameParticipant = Database['public']['Tables']['game_participants']['Row']
type GameParticipantInsert = Database['public']['Tables']['game_participants']['Insert']

export interface CreateGameData {
  question_set_id: string
  mode: 'single' | 'multiplayer'
  max_players?: number
  time_limit?: number
}

export interface JoinGameData {
  game_id: string
  user_id: string
  display_name?: string
}

export interface SubmitAnswerData {
  game_id: string
  participant_id: string
  question_index: number
  selected_answer: string
  is_correct: boolean
  time_taken: number
}

// Generate a unique 6-character game code
function generateGameCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export const gameService = {
  // Create a new game
  async create(data: CreateGameData) {
    const supabase = createClient()
    
    try {
      // Generate unique game code for multiplayer games
      let game_code = null
      if (data.mode === 'multiplayer') {
        let isUnique = false
        while (!isUnique) {
          game_code = generateGameCode()
          const { data: existing } = await supabase
            .from('games')
            .select('id')
            .eq('code', game_code)
            .single()
          
          if (!existing) isUnique = true
        }
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Create the game
      const gameData: GameInsert = {
        question_set_id: data.question_set_id,
        host_user_id: user.id,
        code: game_code,
        status: 'pending',
        game_mode: data.mode,
        max_players: data.max_players || 1,
        time_limit: data.time_limit || 30,
        name: `Game ${new Date().toLocaleDateString()}`,
        started_at: null,
        ended_at: null
      }

      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert(gameData)
        .select()
        .single()

      if (gameError) throw gameError

      // Add creator as first participant
      const participantData: GameParticipantInsert = {
        game_id: game.id,
        user_id: user.id,
        score: 0,
        answers: []
      }

      const { error: participantError } = await supabase
        .from('game_participants')
        .insert(participantData)

      if (participantError) throw participantError

      return { data: game, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  },

  // Join a game by code
  async join(code: string) {
    const supabase = createClient()
    
    try {
      // Find game by code
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('code', code)
        .eq('status', 'pending')
        .single()

      if (gameError || !game) {
        throw new Error('Game not found or already started')
      }

      // Check if game is full
      const { count } = await supabase
        .from('game_participants')
        .select('*', { count: 'exact', head: true })
        .eq('game_id', game.id)

      if (count && game.max_players && count >= game.max_players) {
        throw new Error('Game is full')
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Check if already joined
      const { data: existing } = await supabase
        .from('game_participants')
        .select('id')
        .eq('game_id', game.id)
        .eq('user_id', user.id)
        .single()

      if (existing) {
        return { data: game, error: null }
      }

      // Add as participant
      const participantData: GameParticipantInsert = {
        game_id: game.id,
        user_id: user.id,
        score: 0,
        answers: []
      }

      const { error: participantError } = await supabase
        .from('game_participants')
        .insert(participantData)

      if (participantError) throw participantError

      return { data: game, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  },

  // Update game status
  async updateStatus(gameId: string, status: Game['status']) {
    const supabase = createClient()
    
    try {
      const updates: GameUpdate = { status }
      
      if (status === 'in_progress') {
        updates.started_at = new Date().toISOString()
      } else if (status === 'completed') {
        updates.ended_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('games')
        .update(updates)
        .eq('id', gameId)
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  },

  // Submit an answer
  async submitAnswer(data: SubmitAnswerData) {
    const supabase = createClient()
    
    try {
      // Get current participant data
      const { data: participant, error: fetchError } = await supabase
        .from('game_participants')
        .select('*')
        .eq('id', data.participant_id)
        .single()

      if (fetchError || !participant) throw new Error('Participant not found')

      // Update answers array and score
      const answers = (participant.answers as any[]) || []
      answers[data.question_index] = {
        selected: data.selected_answer,
        is_correct: data.is_correct,
        time_taken: data.time_taken
      }

      const newScore = (participant.score || 0) + (data.is_correct ? 1 : 0)

      const { error: updateError } = await supabase
        .from('game_participants')
        .update({
          answers,
          score: newScore
        })
        .eq('id', data.participant_id)

      if (updateError) throw updateError

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  },

  // Get game leaderboard
  async getLeaderboard(gameId: string) {
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase
        .from('game_participants')
        .select(`
          *,
          user:users!game_participants_user_id_fkey (
            id,
            display_name,
            email
          )
        `)
        .eq('game_id', gameId)
        .order('score', { ascending: false })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  },

  // Get user's games
  async getUserGames(userId: string, status?: Game['status']) {
    const supabase = createClient()
    
    try {
      let query = supabase
        .from('games')
        .select(`
          *,
          question_set:question_sets!games_question_set_id_fkey (
            id,
            name,
            difficulty
          ),
          participants:game_participants (
            id,
            user_id,
            score
          )
        `)
        .or(`host_user_id.eq.${userId},participants.user_id.eq.${userId}`)
        .order('created_at', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }
}