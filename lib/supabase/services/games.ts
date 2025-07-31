import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'
import { GAME_STATUS, type GameStatus } from '@/lib/constants/game-status'

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

      // Get question set name for the game
      const { data: questionSet } = await supabase
        .from('question_sets')
        .select('name')
        .eq('id', data.question_set_id)
        .single()

      // Create the game
      const gameData: GameInsert = {
        question_set_id: data.question_set_id,
        host_id: user.id,
        game_code: game_code!,
        status: GAME_STATUS.PENDING,
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
        current_score: 0
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

      // Games don't have max_players field anymore
      // Could implement a reasonable limit like 10 players
      if (count && count >= 10) {
        throw new Error('Game is full (max 10 players)')
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
        current_score: 0
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
  async updateStatus(gameId: string, status: GameStatus) {
    const supabase = createClient()
    
    try {
      const updates: GameUpdate = { status }
      
      // Games don't have started_at/ended_at fields

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

      // Game participants don't have answers field
      // Just update the score
      const newScore = (participant.current_score || 0) + (data.is_correct ? 1 : 0)

      const { error: updateError } = await supabase
        .from('game_participants')
        .update({
          current_score: newScore
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
            name,
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
  async getUserGames(userId: string, status?: GameStatus) {
    const supabase = createClient()
    
    try {
      // First get all game IDs where user is participant
      const { data: participations, error: participationError } = await supabase
        .from('game_participants')
        .select('game_id')
        .eq('user_id', userId)

      if (participationError) throw participationError

      const participantGameIds = participations?.map(p => p.game_id) || []

      // Now get all games where user is host OR participant
      let gamesQuery = supabase
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
            current_score
          )
        `)
        .or(`host_id.eq.${userId},id.in.(${participantGameIds.join(',')})`)

      if (status) {
        gamesQuery = gamesQuery.eq('status', status)
      }

      const { data: games, error: gamesError } = await gamesQuery
        .order('created_at', { ascending: false })

      if (gamesError) throw gamesError

      return { data: games || [], error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  }
}