'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase/client-with-singleton'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/hooks/use-toast'
import { errorHandler } from '@/lib/errors/handler'
import type { Database } from '@/lib/supabase/database.types'
import { withSession } from '@/utils/supabase/with-session'
import { handleSupabaseError, logAndHandleError } from '@/utils/supabase/error-handler'

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
  const supabaseClient = getSupabaseBrowserClient()
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const targetUserId = userId || currentUser?.id

  // Fetch user profile
  const fetchProfile = useCallback(async () => {
    if (!targetUserId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Use withSession to ensure valid session before fetching profile
      const profileData = await withSession(supabaseClient, async (session) => {
        const { data: userData, error: userError } = await supabaseClient
          .from('users')
          .select('*')
          .eq('id', targetUserId)
          .single()

        if (userError) {
          throw userError
        }

        return userData
      })

      if (!profileData) {
        throw new Error('Unable to fetch profile. Please ensure you are logged in.')
      }

      setProfile(profileData)

      // Fetch user statistics - wrapped in try-catch to handle RLS errors gracefully
      try {
        // Use withSession for game stats to handle session properly
        const games = await withSession(supabaseClient, async (session) => {
          const { data, error } = await supabaseClient
            .from('game_participants')
            .select('*')
            .eq('user_id', targetUserId)

          if (error) {
            const handledError = logAndHandleError('use-profile:game-stats', error)
            // Don't throw for RLS errors on stats - just return null
            return null
          }

          return data
        })

        if (!games) {
          // No session or error - set empty stats
          setStats({
            totalGamesPlayed: 0,
            totalGamesWon: 0,
            winRate: 0,
            totalQuestionsAnswered: 0,
            correctAnswers: 0,
            accuracy: 0,
            currentStreak: 0,
            longestStreak: 0,
            totalQuestionSets: 0,
            publicQuestionSets: 0
          })
        } else {
          // Calculate game statistics
          const totalGamesPlayed = games?.length || 0
          
          // For now, set basic stats
          const statsData: UserStats = {
            totalGamesPlayed,
            totalGamesWon: 0,
            winRate: 0,
            totalQuestionsAnswered: 0,
            correctAnswers: 0,
            accuracy: 0,
            currentStreak: 0,
            longestStreak: 0,
            totalQuestionSets: 0,
            publicQuestionSets: 0
          }

          // Try to fetch question sets with session check
          try {
            const questionSets = await withSession(supabaseClient, async (session) => {
              const { data, error } = await supabaseClient
                .from('question_sets')
                .select('id, is_public')
                .eq('user_id', targetUserId)

              if (error) {
                logAndHandleError('use-profile:question-sets', error)
                return null
              }

              return data
            })

            if (questionSets) {
              statsData.totalQuestionSets = questionSets.length
              statsData.publicQuestionSets = questionSets.filter(s => s.is_public).length
            }
          } catch (err) {
            console.error('Error fetching question sets:', err)
          }

          setStats(statsData)
        }
      } catch (err) {
        console.error('Error fetching stats:', err)
        // Set empty stats instead of showing error
        setStats({
          totalGamesPlayed: 0,
          totalGamesWon: 0,
          winRate: 0,
          totalQuestionsAnswered: 0,
          correctAnswers: 0,
          accuracy: 0,
          currentStreak: 0,
          longestStreak: 0,
          totalQuestionSets: 0,
          publicQuestionSets: 0
        })
      }

    } catch (err) {
      console.error('[USE-PROFILE] Error in fetchProfile:', err)
      const handledError = handleSupabaseError(err)
      const appError = new Error(handledError.message)
      setError(appError)
      toast.error(handledError.message)
    } finally {
      setLoading(false)
    }
  }, [userId, currentUser?.id])

  // Update profile
  const updateProfile = async (updates: ProfileUpdateData) => {
    if (!currentUser || currentUser.id !== targetUserId) {
      toast.error('You can only edit your own profile')
      return { error: new Error('Unauthorized') }
    }

    try {
      setUpdating(true)
      setError(null)

      const { error: updateError } = await supabaseClient
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
      const { error: uploadError } = await supabaseClient.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabaseClient.storage
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
      const { error: deleteError } = await supabaseClient.storage
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
      const { data, error } = await supabaseClient
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
    console.log('[USE-PROFILE] useEffect triggered, targetUserId:', targetUserId)
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