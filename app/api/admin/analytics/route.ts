import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

async function requireAdmin(supabase: any) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'admin') throw new Error('Not authorized')
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    await requireAdmin(supabase)
    // Users
    const { count: totalUsers } = await supabase.from('users').select('id', { count: 'exact', head: true })
    const { count: activeUsers } = await supabase.from('users').select('id', { count: 'exact', head: true }).eq('status', 'active')
    const { count: suspendedUsers } = await supabase.from('users').select('id', { count: 'exact', head: true }).eq('status', 'suspended')
    // Games
    const { count: totalGames } = await supabase.from('games').select('id', { count: 'exact', head: true })
    const { count: activeGames } = await supabase.from('games').select('id', { count: 'exact', head: true }).eq('status', 'active')
    // Question Sets
    const { count: totalQuestionSets } = await supabase.from('question_sets').select('id', { count: 'exact', head: true })
    // Recent activity (last 7 days)
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { count: newUsers } = await supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', since)
    const { count: newGames } = await supabase.from('games').select('id', { count: 'exact', head: true }).gte('created_at', since)
    const { count: newQuestionSets } = await supabase.from('question_sets').select('id', { count: 'exact', head: true }).gte('created_at', since)
    return NextResponse.json({
      totalUsers, activeUsers, suspendedUsers,
      totalGames, activeGames,
      totalQuestionSets,
      newUsers, newGames, newQuestionSets,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 })
  }
} 