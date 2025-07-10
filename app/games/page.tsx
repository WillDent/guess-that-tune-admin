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
import type { GameWithDetails } from './types'

async function getUserGames(userId: string) {
  const supabase = await createServerClient()
  
  // Fetch all user's games with details
  const { data, error } = await supabase
    .from('games')
    .select(`
      *,
      question_set:question_sets!games_question_set_id_fkey (
        id,
        name,
        difficulty
      ),
      participants:game_participants (*)
    `)
    .or(`host_user_id.eq.${userId},participants.user_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch games:', error)
    return { active: [], completed: [] }
  }

  // Transform and categorize games
  const games = (data || []).map(game => ({
    ...game,
    participant_count: game.participants?.length || 0
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Games</h1>
          <p className="mt-2 text-gray-600">
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