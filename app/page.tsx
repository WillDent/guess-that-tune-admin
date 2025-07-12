// ABOUTME: Main landing page for the admin dashboard
// ABOUTME: Server component that fetches overview stats
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { requireAuth } from '@/utils/supabase/auth'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardContent } from './dashboard-content'
import { Card } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

async function getDashboardStats(userId: string) {
  const supabase = await createServerClient()
  
  // Fetch all stats in parallel
  const [questionSetsResult, gamesResult, playersResult] = await Promise.all([
    // Count question sets
    supabase
      .from('question_sets')
      .select('id, questions(count)')
      .eq('user_id', userId),
    
    // Count active games (pending or in_progress)
    supabase
      .from('games')
      .select('id')
      .eq('host_id', userId)
      .in('status', ['pending', 'in_progress']),
    
    // Count unique players who have participated in user's games
    supabase
      .from('games')
      .select('id, game_participants(user_id)')
      .eq('host_id', userId)
  ])

  // Calculate total songs (questions across all sets)
  let totalSongs = 0
  if (questionSetsResult.data) {
    totalSongs = questionSetsResult.data.reduce((sum: number, set: any) => {
      const count = Array.isArray(set.questions) 
        ? set.questions.length 
        : (set.questions as any)?.count || 0
      return sum + count
    }, 0)
  }

  // Get unique player count
  const uniquePlayers = new Set()
  if (playersResult.data) {
    playersResult.data.forEach((game: any) => {
      if (Array.isArray(game.game_participants)) {
        game.game_participants.forEach((participant: any) => {
          uniquePlayers.add(participant.user_id)
        })
      }
    })
  }

  return {
    totalSongs,
    questionSets: questionSetsResult.data?.length || 0,
    activeGames: gamesResult.data?.length || 0,
    totalPlayers: uniquePlayers.size
  }
}

async function getUserProfile(userId: string) {
  const supabase = await createServerClient()
  
  const { data: profile } = await supabase
    .from('users')
    .select('display_name, email')
    .eq('id', userId)
    .single()
  
  return profile
}

export default async function Home() {
  const supabase = await createServerClient()
  const user = await requireAuth(supabase)
  
  if (!user) {
    redirect('/login')
  }

  // Fetch stats and profile in parallel
  const [stats, profile] = await Promise.all([
    getDashboardStats(user.id),
    getUserProfile(user.id)
  ])

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'User'

  return (
    <ProtectedRoute>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {displayName}! Here's your game overview.
          </p>
        </div>

        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent stats={stats} />
        </Suspense>
      </div>
    </ProtectedRoute>
  )
}

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="ml-4 flex-1">
              <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse" />
              <div className="h-8 bg-gray-200 rounded w-16 animate-pulse" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}