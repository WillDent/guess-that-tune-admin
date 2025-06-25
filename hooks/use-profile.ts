'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'
import { errorHandler } from '@/lib/errors/handler'
import type { Database } from '@/lib/supabase/database.types'

type UserProfile = Database['public']['Tables']['users']['Row'] & {
  stats?: UserStats
  bio?: string | null
  location?: string | null
  website?: string | null
  twitter_handle?: string | null
  is_public?: boolean
  email_notifications?: boolean
  email_confirmed_at?: string | null
}

export interface UserStats {
  totalGamesPlayed: number
  totalGamesWon: number
  winRate: number
  totalQuestionsAnswered: number
  correctAnswers: number
  accuracy: number
  favoriteGenre?: string
  currentStreak: number
  longestStreak: number
  totalQuestionSets: number
  publicQuestionSets: number
}

export interface ProfileUpdateData {
  display_name?: string
  username?: string
  bio?: string
  location?: string
  website?: string
  twitter_handle?: string
  is_public?: boolean
  email_notifications?: boolean
  avatar_url?: string
}

export function useProfile(userId?: string) {
  const { user: currentUser } = useAuth()
  const { toast } = useToast()
  const supabase = createClient()
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const targetUserId = userId || currentUser?.id

  // Fetch user profile
  const fetchProfile = useCallback(async () => {
    if (!targetUserId) return

    try {
      setLoading(true)
      setError(null)

      // Fetch user profile
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', targetUserId)
        .single()

      if (profileError) throw profileError

      setProfile(userProfile)

      // Fetch user statistics
      await fetchStats()

    } catch (err) {
      const appError = errorHandler.handle(err)
      setError(appError)
      toast.error(errorHandler.getErrorMessage(appError))
    } finally {
      setLoading(false)
    }
  }, [targetUserId, supabase, toast])

  // Fetch user statistics
  const fetchStats = async () => {
    if (!targetUserId) return

    try {
      // Fetch games data
      const { data: games, error: gamesError } = await supabase
        .from('game_participants')
        .select(`
          *,
          game:games!game_participants_game_id_fkey (
            id,
            status,
            host_user_id
          )
        `)
        .eq('user_id', targetUserId)

      if (gamesError) throw gamesError

      // Calculate game statistics
      const completedGames = games?.filter(g => g.game?.status === 'completed') || []
      const totalGamesPlayed = completedGames.length
      
      // Count wins (highest score in completed games)
      let totalGamesWon = 0
      for (const game of completedGames) {
        const { data: participants } = await supabase
          .from('game_participants')
          .select('score')
          .eq('game_id', game.game_id)
          .order('score', { ascending: false })
          .limit(1)
          
        if (participants?.[0]?.score === game.score) {
          totalGamesWon++
        }
      }

      // Calculate answer statistics
      let totalQuestionsAnswered = 0
      let correctAnswers = 0
      
      for (const game of games || []) {
        const answers = (game.answers as any[]) || []
        totalQuestionsAnswered += answers.length
        correctAnswers += answers.filter(a => a.is_correct).length
      }

      // Fetch question sets
      const { data: questionSets, error: setsError } = await supabase
        .from('question_sets')
        .select('id, is_public')
        .eq('user_id', targetUserId)

      if (setsError) throw setsError

      const totalQuestionSets = questionSets?.length || 0
      const publicQuestionSets = questionSets?.filter(s => s.is_public).length || 0

      // Calculate derived stats
      const winRate = totalGamesPlayed > 0 ? (totalGamesWon / totalGamesPlayed) * 100 : 0
      const accuracy = totalQuestionsAnswered > 0 ? (correctAnswers / totalQuestionsAnswered) * 100 : 0

      const statsData: UserStats = {
        totalGamesPlayed,
        totalGamesWon,
        winRate,
        totalQuestionsAnswered,
        correctAnswers,
        accuracy,
        currentStreak: 0, // TODO: Implement streak calculation
        longestStreak: 0, // TODO: Implement streak calculation
        totalQuestionSets,
        publicQuestionSets
      }

      setStats(statsData)
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  // Update profile
  const updateProfile = async (updates: ProfileUpdateData) => {
    if (!currentUser || currentUser.id !== targetUserId) {
      toast.error('You can only edit your own profile')
      return { error: new Error('Unauthorized') }
    }

    try {
      setUpdating(true)
      setError(null)

      const { error: updateError } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id)

      if (updateError) throw updateError

      // Update local state
      setProfile(prev => prev ? { ...prev, ...updates } : null)
      
      toast.success('Profile updated successfully')
      return { error: null }
      
    } catch (err) {
      const appError = errorHandler.handle(err)
      setError(appError)
      toast.error(errorHandler.getErrorMessage(appError))
      return { error: appError }
    } finally {
      setUpdating(false)
    }
  }

  // Upload avatar
  const uploadAvatar = async (file: File) => {
    if (!currentUser || currentUser.id !== targetUserId) {
      toast.error('You can only update your own avatar')
      return { url: null, error: new Error('Unauthorized') }
    }

    try {
      setUpdating(true)
      
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file')
      }
      
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size must be less than 5MB')
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update user profile with new avatar URL
      await updateProfile({ 
        avatar_url: publicUrl,
      })

      return { url: publicUrl, error: null }
      
    } catch (err) {
      const appError = errorHandler.handle(err)
      toast.error(errorHandler.getErrorMessage(appError))
      return { url: null, error: appError }
    } finally {
      setUpdating(false)
    }
  }

  // Delete avatar
  const deleteAvatar = async () => {
    if (!currentUser || !profile?.avatar_url) return

    try {
      setUpdating(true)
      
      // Extract file path from URL
      const url = new URL(profile.avatar_url)
      const filePath = url.pathname.split('/').slice(-2).join('/')

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([filePath])

      if (deleteError) throw deleteError

      // Update profile
      await updateProfile({ avatar_url: undefined })
      
    } catch (err) {
      const appError = errorHandler.handle(err)
      toast.error(errorHandler.getErrorMessage(appError))
    } finally {
      setUpdating(false)
    }
  }

  // Check username availability
  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      return { available: false, error: 'Username must be at least 3 characters' }
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single()

      if (error && error.code === 'PGRST116') {
        // No rows found - username is available
        return { available: true, error: null }
      }
      
      if (data && data.id !== currentUser?.id) {
        return { available: false, error: 'Username already taken' }
      }

      return { available: true, error: null }
      
    } catch (err) {
      return { available: false, error: 'Error checking username' }
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return {
    profile,
    stats,
    loading,
    updating,
    error,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    checkUsernameAvailability,
    refetch: fetchProfile,
    isOwnProfile: currentUser?.id === targetUserId
  }
}