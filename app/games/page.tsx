// ABOUTME: Games page showing all created games
// ABOUTME: Server component that fetches user's games
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { requireAuth } from '@/utils/supabase/auth'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { GamesContent } from './games-content'
import { GAME_STATUS } from '@/lib/constants/game-status'
import { withSupabaseRetry } from '@/lib/supabase/retry-wrapper'
import type { GameWithDetails } from './types'

async function getUserGames(userId: string) {
  const supabase = await createServerClient()
  
  // Fetch games with a simpler query to avoid RLS recursion
  const { data, error } = await withSupabaseRetry(
    () => supabase
      .from('games')
      .select('*')
      .eq('host_user_id', userId)
      .order('created_at', { ascending: false }),
    { 
      maxRetries: 2,
      onRetry: (attempt, error) => {
        console.warn(`[getUserGames] Retry attempt ${attempt} after error:`, error.message)
      }
    }
  )

  if (error) {
    console.error('Failed to fetch games:', error)
    // Return empty arrays to prevent page crash due to RLS policy issue
    // TODO: Fix the infinite recursion in the games table RLS policy
    return { active: [], completed: [] }
  }

  // Transform games without participant data to avoid RLS recursion
  const games = (data || []).map((game) => ({
    ...game,
    question_set: {
      id: game.question_set_id,
      name: 'Loading...', // Will need to fetch separately or update UI
      difficulty: 'medium' as const
    },
    participants: [],
    participant_count: 0 // We'll show this as "N/A" in the UI for now
  })) as GameWithDetails[]

  const active = games.filter(g => 
    g.status === GAME_STATUS.PENDING || g.status === GAME_STATUS.IN_PROGRESS
  )
  
  const completed = games.filter(g => 
    g.status === GAME_STATUS.COMPLETED
  )

  return { active, completed }
}

export default async function GamesPage() {
  const supabase = await createServerClient()
  
  // This page requires authentication
  let user
  try {
    user = await requireAuth(supabase)
  } catch {
    redirect('/login')
  }

  const { active, completed } = await getUserGames(user.id)

  return (
    <ProtectedRoute>
      <div>
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Games</h1>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
            Manage your games and join new ones
          </p>
        </div>

        <Suspense fallback={<LoadingSpinner />}>
          <GamesContent 
            activeGames={active}
            completedGames={completed}
            userId={user.id}
          />
        </Suspense>
      </div>
    </ProtectedRoute>
  )
}