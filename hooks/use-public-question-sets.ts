'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/auth-context'
import type { Database } from '@/lib/supabase/database.types'
import { useDebounce } from '@/hooks/use-debounce'
import { withSession } from '@/utils/supabase/with-session'
import { handleSupabaseError, logAndHandleError } from '@/utils/supabase/error-handler'

type QuestionSet = Database['public']['Tables']['question_sets']['Row']
type User = Database['public']['Tables']['users']['Row']

export interface PublicQuestionSet extends QuestionSet {
  user: Pick<User, 'id' | 'name' | 'email'>
  is_favorited?: boolean
  question_count: number
}

export type SortOption = 'newest' | 'popular' | 'alphabetical'
export type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard'

interface UsePublicQuestionSetsOptions {
  searchTerm?: string
  difficulty?: DifficultyFilter
  sortBy?: SortOption
  onlyFavorites?: boolean
}

export function usePublicQuestionSets(options: UsePublicQuestionSetsOptions = {}) {
  const { user } = useAuth()
  const supabase = createClient()
  
  const [questionSets, setQuestionSets] = useState<PublicQuestionSet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  
  const debouncedSearchTerm = useDebounce(options.searchTerm || '', 300)
  const pageSize = 12

  const fetchQuestionSets = useCallback(async (reset = false) => {
    try {
      setLoading(true)
      setError(null)

      const currentPage = reset ? 0 : page
      if (reset) setPage(0)

      // Debug: Log parameters
      console.log('[usePublicQuestionSets] Fetching question sets with params:', {
        currentPage,
        pageSize,
        searchTerm: options.searchTerm,
        debouncedSearchTerm,
        difficulty: options.difficulty,
        sortBy: options.sortBy,
        onlyFavorites: options.onlyFavorites,
        user: user ? user.id : null
      })

      let query = supabase
        .from('question_sets')
        .select(`
          *,
          user:users!question_sets_user_id_fkey (
            id,
            display_name,
            email
          ),
          questions (count)
        `)
        .eq('is_public', true)
        .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1)

      // Apply difficulty filter
      if (options.difficulty && options.difficulty !== 'all') {
        query = query.eq('difficulty', options.difficulty)
      }

      // Apply search if term exists
      if (debouncedSearchTerm) {
        query = query.or(`name.ilike.%${debouncedSearchTerm}%,description.ilike.%${debouncedSearchTerm}%`)
      }

      // Apply sorting
      switch (options.sortBy) {
        case 'popular':
          query = query.order('play_count', { ascending: false })
          break
        case 'alphabetical':
          query = query.order('name', { ascending: true })
          break
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false })
          break
      }

      // Debug: Log the query object (as much as possible)
      console.log('[usePublicQuestionSets] About to execute Supabase query')

      const { data, error: fetchError } = await query

      if (fetchError) {
        const handledError = logAndHandleError('use-public-question-sets:fetch', fetchError)
        throw new Error(handledError.message)
      }

      // Transform the data to include question count
      const transformedData = (data || []).map((set: any) => ({
        ...set,
        user: set.user as Pick<User, 'id' | 'name' | 'email'>,
        question_count: Array.isArray(set.questions) ? set.questions.length : (set.questions as any)?.count || 0
      }))

      // Fetch favorites if user is logged in
      let favoritedSets: string[] = []
      if (user) {
        // Use withSession to ensure valid session before querying favorites
        const favorites = await withSession(supabase, async (session) => {
          const { data, error } = await supabase
            .from('favorites')
            .select('question_set_id')
            .eq('user_id', session.user.id)
          
          if (error) {
            logAndHandleError('use-public-question-sets:favorites', error)
            // Don't throw - just return empty favorites
            return []
          }
          
          return data || []
        })
        
        favoritedSets = favorites?.map(f => f.question_set_id) || []
        console.log('[usePublicQuestionSets] Favorites fetched:', favoritedSets.length)
      }

      // Add favorited status
      const setsWithFavorites = transformedData.map(set => ({
        ...set,
        is_favorited: favoritedSets.includes(set.id)
      }))

      // Filter by favorites if requested
      const filteredSets = options.onlyFavorites 
        ? setsWithFavorites.filter(set => set.is_favorited)
        : setsWithFavorites

      if (reset) {
        setQuestionSets(filteredSets)
      } else {
        setQuestionSets(prev => [...prev, ...filteredSets])
      }

      setHasMore(filteredSets.length === pageSize)
    } catch (err) {
      const handledError = handleSupabaseError(err)
      const error = new Error(handledError.message)
      setError(error)
      console.error('[usePublicQuestionSets] Error:', handledError)
    } finally {
      setLoading(false)
    }
  }, [supabase, user?.id, page, debouncedSearchTerm, options.difficulty, options.sortBy, options.onlyFavorites, pageSize])

  // Reset and refetch when filters change
  useEffect(() => {
    fetchQuestionSets(true)
  }, [debouncedSearchTerm, options.difficulty, options.sortBy, options.onlyFavorites])

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1)
    }
  }, [loading, hasMore])

  // Fetch more when page changes
  useEffect(() => {
    if (page > 0) {
      fetchQuestionSets(false)
    }
  }, [page])

  const toggleFavorite = async (questionSetId: string) => {
    if (!user) return { error: new Error('Must be logged in to favorite') }

    try {
      const isFavorited = questionSets.find(s => s.id === questionSetId)?.is_favorited

      if (isFavorited) {
        // Remove favorite
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('question_set_id', questionSetId)

        if (error) throw error
      } else {
        // Add favorite
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            question_set_id: questionSetId
          })

        if (error) throw error
      }

      // Update local state
      setQuestionSets(prev => 
        prev.map(set => 
          set.id === questionSetId 
            ? { ...set, is_favorited: !set.is_favorited }
            : set
        )
      )

      return { error: null }
    } catch (err) {
      return { error: err as Error }
    }
  }

  return {
    questionSets,
    loading,
    error,
    hasMore,
    loadMore,
    toggleFavorite,
    refetch: () => fetchQuestionSets(true)
  }
}