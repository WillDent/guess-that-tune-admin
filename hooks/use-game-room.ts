'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'
import { errorHandler } from '@/lib/errors/handler'
import type { Database } from '@/lib/supabase/database.types'
import { GAME_STATUS } from '@/lib/constants/game-status'

type Game = Database['public']['Tables']['games']['Row']
type GameParticipant = Database['public']['Tables']['game_participants']['Row']
type Question = Database['public']['Tables']['questions']['Row']

export interface Player {
  id: string
  user_id: string
  display_name: string
  email: string
  score: number
  is_ready: boolean
  is_host: boolean
  answers: any[]
  joined_at: string
  presence_state?: 'online' | 'away'
}

export interface GameRoomState {
  game: Game | null
  players: Player[]
  currentQuestion: Question | null
  currentQuestionIndex: number
  questions: Question[]
  timeRemaining: number
  gameState: 'lobby' | 'playing' | 'finished'
  isHost: boolean
}

export interface GameEvent {
  type: 'player_joined' | 'player_left' | 'game_started' | 'question_changed' | 
        'answer_submitted' | 'game_ended' | 'player_ready' | 'time_sync'
  payload: any
}

export function useGameRoom(gameId: string) {
  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()
  
  const [state, setState] = useState<GameRoomState>({
    game: null,
    players: [],
    currentQuestion: null,
    currentQuestionIndex: 0,
    questions: [],
    timeRemaining: 0,
    gameState: 'lobby',
    isHost: false
  })
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  const channelRef = useRef<RealtimeChannel | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize game room
  const initializeGameRoom = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Fetch game details with questions
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select(`
          *,
          question_set:question_sets!games_question_set_id_fkey (
            id,
            name,
            questions (*)
          )
        `)
        .eq('id', gameId)
        .single()
        
      if (gameError || !game) {
        throw new Error('Game not found')
      }
      
      // Fetch participants
      const { data: participants, error: participantsError } = await supabase
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
        
      if (participantsError) throw participantsError
      
      // Transform participants to players
      const players: Player[] = (participants || []).map(p => ({
        id: p.id,
        user_id: p.user_id || '',
        display_name: p.user?.display_name || p.guest_name || 'Anonymous',
        email: p.user?.email || '',
        score: p.score || 0,
        is_ready: false,
        is_host: p.user_id === game.host_user_id,
        answers: (p.answers as any[]) || [],
        joined_at: p.joined_at,
        presence_state: 'online'
      }))
      
      // Sort questions by order_index
      const questions = game.question_set?.questions?.sort((a, b) => 
        a.order_index - b.order_index
      ) || []
      
      setState({
        game,
        players,
        currentQuestion: questions[0] || null,
        currentQuestionIndex: 0,
        questions,
        timeRemaining: game.time_limit || 30,
        gameState: game.status === GAME_STATUS.PENDING ? 'lobby' : 
                   game.status === GAME_STATUS.IN_PROGRESS ? 'playing' : 'finished',
        isHost: user.id === game.host_user_id
      })
      
    } catch (err) {
      const appError = errorHandler.handle(err)
      setError(appError)
      toast.error(errorHandler.getErrorMessage(appError))
    } finally {
      setLoading(false)
    }
  }, [gameId, user?.id]) // Only depend on stable values

  // Refetch participants
  const refetchParticipants = useCallback(async () => {
    const { data: participants, error } = await supabase
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
      
    if (!error && participants) {
      setState(prev => {
        const players: Player[] = participants.map(p => ({
          id: p.id,
          user_id: p.user_id || '',
          display_name: p.user?.display_name || p.guest_name || 'Anonymous',
          email: p.user?.email || '',
          score: p.score || 0,
          is_ready: false,
          is_host: p.user_id === prev.game?.host_user_id,
          answers: (p.answers as any[]) || [],
          joined_at: p.joined_at,
          presence_state: 'online'
        }))
        
        return { ...prev, players }
      })
    }
  }, [gameId, supabase])

  // Set up real-time subscriptions
  const setupSubscriptions = useCallback(() => {
    if (!user || !gameId) return

    // Create channel for this game room
    const channel = supabase.channel(`game:${gameId}`)
    
    // Track player presence
    channel
      .on('presence', { event: 'sync' }, () => {
        const presence = channel.presenceState() as RealtimePresenceState<{
          user_id: string
          display_name: string
        }>
        
        setState(prev => ({
          ...prev,
          players: prev.players.map(p => ({
            ...p,
            presence_state: Object.keys(presence).some(key => 
              presence[key]?.[0]?.user_id === p.user_id
            ) ? 'online' : 'away'
          }))
        }))
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        toast.success(`${newPresences[0]?.display_name} joined the game`)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        toast.info(`${leftPresences[0]?.display_name} left the game`)
      })
    
    // Listen for game participant changes
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'game_participants',
        filter: `game_id=eq.${gameId}`
      },
      async (payload) => {
        if (payload.eventType === 'INSERT') {
          // New player joined - refetch participants
          await refetchParticipants()
        } else if (payload.eventType === 'UPDATE') {
          // Player updated (score, answers, etc)
          setState(prev => ({
            ...prev,
            players: prev.players.map(p => 
              p.id === payload.new.id
                ? { ...p, score: payload.new.score, answers: payload.new.answers }
                : p
            )
          }))
        } else if (payload.eventType === 'DELETE') {
          // Player left
          setState(prev => ({
            ...prev,
            players: prev.players.filter(p => p.id !== payload.old.id)
          }))
        }
      }
    )
    
    // Listen for game status changes
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${gameId}`
      },
      (payload) => {
        setState(prev => ({
          ...prev,
          game: payload.new as Game,
          gameState: payload.new.status === GAME_STATUS.PENDING ? 'lobby' :
                     payload.new.status === GAME_STATUS.IN_PROGRESS ? 'playing' : 'finished'
        }))
        
        if (payload.new.status === GAME_STATUS.IN_PROGRESS) {
          // Game started
          startGameTimer()
        }
      }
    )
    
    // Listen for broadcast events
    channel.on('broadcast', { event: 'game_event' }, ({ payload }) => {
      handleGameEvent(payload as GameEvent)
    })
    
    // Subscribe and track presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: user.id,
          display_name: user.email || 'Anonymous'
        })
      }
    })
    
    channelRef.current = channel
  }, [gameId, user?.id, refetchParticipants]) // Don't include toast to avoid re-renders

  // Handle game events
  const handleGameEvent = (event: GameEvent) => {
    switch (event.type) {
      case 'player_ready':
        setState(prev => ({
          ...prev,
          players: prev.players.map(p => 
            p.user_id === event.payload.user_id
              ? { ...p, is_ready: event.payload.is_ready }
              : p
          )
        }))
        break
        
      case 'question_changed':
        setState(prev => ({
          ...prev,
          currentQuestionIndex: event.payload.index,
          currentQuestion: prev.questions[event.payload.index],
          timeRemaining: prev.game?.time_limit || 30
        }))
        restartTimer()
        break
        
      case 'time_sync':
        setState(prev => ({
          ...prev,
          timeRemaining: event.payload.time
        }))
        break
        
      case 'game_ended':
        setState(prev => ({
          ...prev,
          gameState: 'finished'
        }))
        stopTimer()
        break
    }
  }

  // Timer management
  const startGameTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    
    timerRef.current = setInterval(() => {
      setState(prev => {
        const newTime = prev.timeRemaining - 1
        
        // Broadcast time sync every 5 seconds
        if (newTime % 5 === 0 && prev.isHost) {
          broadcastEvent({
            type: 'time_sync',
            payload: { time: newTime }
          })
        }
        
        // Auto advance to next question
        if (newTime <= 0 && prev.isHost) {
          if (prev.currentQuestionIndex < prev.questions.length - 1) {
            nextQuestion()
          } else {
            endGame()
          }
        }
        
        return { ...prev, timeRemaining: Math.max(0, newTime) }
      })
    }, 1000)
  }
  
  const restartTimer = () => {
    stopTimer()
    startGameTimer()
  }
  
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  // Broadcast event to all players
  const broadcastEvent = async (event: GameEvent) => {
    if (!channelRef.current) return
    
    await channelRef.current.send({
      type: 'broadcast',
      event: 'game_event',
      payload: event
    })
  }

  // Player actions
  const setReady = async (ready: boolean) => {
    await broadcastEvent({
      type: 'player_ready',
      payload: { user_id: user?.id, is_ready: ready }
    })
  }

  const startGame = async () => {
    if (!state.isHost) return
    
    const { error } = await supabase
      .from('games')
      .update({ 
        status: GAME_STATUS.IN_PROGRESS,
        started_at: new Date().toISOString()
      })
      .eq('id', gameId)
      
    if (error) {
      const appError = errorHandler.handle(error)
      toast.error(errorHandler.getErrorMessage(appError))
    }
  }

  const submitAnswer = async (answer: string) => {
    if (!user || !state.currentQuestion) return
    
    const participant = state.players.find(p => p.user_id === user.id)
    if (!participant) return
    
    const isCorrect = answer === state.currentQuestion.correct_song_id
    const timeTaken = (state.game?.time_limit || 30) - state.timeRemaining
    
    // Update participant answers
    const { error } = await supabase
      .from('game_participants')
      .update({
        answers: [
          ...(participant.answers || []),
          {
            question_index: state.currentQuestionIndex,
            selected_answer: answer,
            is_correct: isCorrect,
            time_taken: timeTaken
          }
        ],
        score: participant.score + (isCorrect ? 1 : 0)
      })
      .eq('id', participant.id)
      
    if (error) {
      const appError = errorHandler.handle(error)
      toast.error(errorHandler.getErrorMessage(appError))
    }
  }

  const nextQuestion = async () => {
    if (!state.isHost) return
    
    const nextIndex = state.currentQuestionIndex + 1
    if (nextIndex < state.questions.length) {
      await broadcastEvent({
        type: 'question_changed',
        payload: { index: nextIndex }
      })
    }
  }

  const endGame = async () => {
    if (!state.isHost) return
    
    const { error } = await supabase
      .from('games')
      .update({ 
        status: GAME_STATUS.COMPLETED,
        ended_at: new Date().toISOString()
      })
      .eq('id', gameId)
      
    if (error) {
      const appError = errorHandler.handle(error)
      toast.error(errorHandler.getErrorMessage(appError))
    }
    
    await broadcastEvent({
      type: 'game_ended',
      payload: {}
    })
  }

  // Cleanup
  const cleanup = () => {
    stopTimer()
    if (channelRef.current) {
      channelRef.current.unsubscribe()
      channelRef.current = null
    }
  }

  // Initialize on mount
  useEffect(() => {
    if (!user || !gameId) return
    
    // Initialize the game room
    initializeGameRoom()
    
    // Setup subscriptions
    setupSubscriptions()
    
    // Cleanup on unmount or when dependencies change
    return cleanup
  }, [gameId, user?.id]) // Only run when gameId or user changes

  return {
    ...state,
    loading,
    error,
    setReady,
    startGame,
    submitAnswer,
    nextQuestion,
    endGame
  }
}