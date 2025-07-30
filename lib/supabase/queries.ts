// Optimized query patterns for common database operations

import { createServerClient } from './server'
import { measureSupabaseQuery } from '@/lib/monitoring/performance'
import type { Database } from './database.types'

type Tables = Database['public']['Tables']

// Optimized query for fetching question sets with related data
export async function getQuestionSetsWithDetails(
  filters?: {
    userId?: string
    categoryId?: string
    isPublic?: boolean
    limit?: number
    offset?: number
  }
) {
  return measureSupabaseQuery('getWithDetails', 'question_sets', async (supabase) => {
    let query = supabase
      .from('question_sets')
      .select(`
        id,
        title,
        description,
        thumbnail_url,
        is_public,
        created_at,
        updated_at,
        user:users!created_by(
          id,
          name,
          avatar_url
        ),
        category:categories(
          id,
          name,
          slug
        ),
        _count:questions(count),
        _favorites:favorites(count)
      `, { count: 'exact' })
    
    // Apply filters
    if (filters?.userId) {
      query = query.eq('created_by', filters.userId)
    }
    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId)
    }
    if (filters?.isPublic !== undefined) {
      query = query.eq('is_public', filters.isPublic)
    }
    
    // Apply pagination
    if (filters?.limit) {
      const offset = filters.offset || 0
      query = query.range(offset, offset + filters.limit - 1)
    }
    
    // Order by most recent
    query = query.order('created_at', { ascending: false })
    
    return query
  })
}

// Optimized query for single question set with all questions
export async function getQuestionSetComplete(questionSetId: string) {
  return measureSupabaseQuery('getComplete', 'question_sets', async (supabase) => {
    return supabase
      .from('question_sets')
      .select(`
        *,
        user:users!created_by(
          id,
          name,
          avatar_url
        ),
        category:categories(
          id,
          name,
          slug
        ),
        questions(
          id,
          question_text,
          answer,
          difficulty,
          points,
          time_limit,
          hint,
          media_url,
          media_type,
          display_order
        )
      `)
      .eq('id', questionSetId)
      .single()
  })
}

// Optimized dashboard stats query
export async function getUserDashboardStats(userId: string) {
  const supabase = await createServerClient()
  
  // Run all queries in parallel
  const [questionSets, games, favorites]: any[] = await Promise.all([
    measureSupabaseQuery('countUserSets', 'question_sets', async (client) => 
      client
        .from('question_sets')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', userId)
    ),
    
    measureSupabaseQuery('countUserGames', 'game_participants', async (client) =>
      client
        .from('game_participants')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
    ),
    
    measureSupabaseQuery('countUserFavorites', 'favorites', async (client) =>
      client
        .from('favorites')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
    )
  ])
  
  return {
    questionSetsCount: questionSets.count || 0,
    gamesPlayedCount: games.count || 0,
    favoritesCount: favorites.count || 0
  }
}

// Batch fetch users for leaderboard
export async function getLeaderboardUsers(limit = 10) {
  return measureSupabaseQuery('getLeaderboard', 'users', async (supabase) => {
    // This would need a proper leaderboard implementation
    // For now, showing pattern for batch user fetch
    return supabase
      .from('users')
      .select(`
        id,
        name,
        avatar_url,
        _stats:game_participants(count)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
  })
}

// Search question sets with full-text search
export async function searchQuestionSets(searchTerm: string, limit = 20) {
  return measureSupabaseQuery('search', 'question_sets', async (supabase) => {
    return supabase
      .rpc('search_question_sets', {
        search_term: searchTerm
      })
      .select(`
        id,
        title,
        description,
        thumbnail_url,
        user:users!created_by(name, avatar_url),
        _count:questions(count)
      `)
      .limit(limit)
  })
}

// Get popular question sets (cached)
export async function getPopularQuestionSets(days = 7, limit = 6) {
  return measureSupabaseQuery('getPopular', 'question_sets', async (supabase) => {
    const sinceDate = new Date()
    sinceDate.setDate(sinceDate.getDate() - days)
    
    return supabase
      .from('question_sets')
      .select(`
        id,
        title,
        description,
        thumbnail_url,
        user:users!created_by(name, avatar_url),
        _count:questions(count),
        _favorites:favorites(count)
      `)
      .eq('is_public', true)
      .gte('created_at', sinceDate.toISOString())
      .order('favorites_count', { ascending: false })
      .limit(limit)
  })
}