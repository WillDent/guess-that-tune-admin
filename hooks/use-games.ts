'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/contexts/auth-context'
import { gameService } from '@/lib/supabase/services/games'
import type { Database } from '@/lib/supabase/database.types'
import type { GameStatus } from '@/lib/constants/game-status'

type Game = Database['public']['Tables']['games']['Row']
type QuestionSet = Database['public']['Tables']['question_sets']['Row']
type GameParticipant = Database['public']['Tables']['game_participants']['Row']

export interface GameWithDetails extends Game {
  question_set: Pick<QuestionSet, 'id' | 'name' | 'difficulty'>
  participants: GameParticipant[]
  participant_count?: number
}

export function useGames(status?: GameStatus) {
  const { user } = useAuth()
  const [games, setGames] = useState<GameWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClient()

  const fetchGames = useCallback(async () => {
    if (!user) {
      setGames([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await gameService.getUserGames(user.id, status)

      if (error) throw error

      // Transform and enrich game data
      const transformedGames = (data || []).map(game => ({
        ...game,
        participant_count: game.participants?.length || 0
      })) as GameWithDetails[]

      setGames(transformedGames)
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching games:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id, status])

  useEffect(() => {
    fetchGames()
  }, [fetchGames])

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('user-games')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'games',
          filter: `host_user_id=eq.${user.id}`
        },
        () => {
          fetchGames()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_participants',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchGames()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, supabase, fetchGames])

  const createGame = async (data: Parameters<typeof gameService.create>[0]) => {
    try {
      setError(null)
      const result = await gameService.create(data)
      
      if (result.error) throw result.error
      
      // Refresh games list
      await fetchGames()
      
      return result
    } catch (err) {
      const error = err as Error
      setError(error)
      return { data: null, error }
    }
  }

  const joinGame = async (code: string) => {
    try {
      setError(null)
      const result = await gameService.join(code)
      
      if (result.error) throw result.error
      
      // Refresh games list
      await fetchGames()
      
      return result
    } catch (err) {
      const error = err as Error
      setError(error)
      return { data: null, error }
    }
  }

  const updateGameStatus = async (gameId: string, status: GameStatus) => {
    try {
      setError(null)
      const result = await gameService.updateStatus(gameId, status)
      
      if (result.error) throw result.error
      
      // Refresh games list
      await fetchGames()
      
      return result
    } catch (err) {
      const error = err as Error
      setError(error)
      return { data: null, error }
    }
  }

  return {
    games,
    loading,
    error,
    createGame,
    joinGame,
    updateGameStatus,
    refetch: fetchGames
  }
}