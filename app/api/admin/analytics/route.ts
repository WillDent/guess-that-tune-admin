import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRoute, logAndHandleError } from '@/utils/supabase'

export async function GET(req: NextRequest) {
  return requireAdminRoute(req, async (user, supabase) => {
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

    // Time series (last 30 days)
    const today = new Date();
    const startDate = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
    const startDateStr = startDate.toISOString().slice(0, 10);
    // Users per day
    const { data: usersSeries } = await supabase.rpc('time_series_counts', { table_name: 'users', start_date: startDateStr })
    // Games per day
    const { data: gamesSeries } = await supabase.rpc('time_series_counts', { table_name: 'games', start_date: startDateStr })
    // Question sets per day
    const { data: questionSetsSeries } = await supabase.rpc('time_series_counts', { table_name: 'question_sets', start_date: startDateStr })

    // Top 5 active users (by games hosted)
    const { data: topUsers } = await supabase
      .from('games')
      .select('host_user_id, count:id', { groupBy: 'host_user_id' })
      .not('host_user_id', 'is', null)
      .order('count', { ascending: false })
      .limit(5)
    let topUsersWithEmail = []
    if (topUsers && topUsers.length > 0) {
      const userIds = topUsers.map((u: any) => u.host_user_id)
      const { data: users } = await supabase.from('users').select('id, email').in('id', userIds)
      const emailMap = Object.fromEntries((users || []).map((u: any) => [u.id, u.email]))
      topUsersWithEmail = topUsers.map((u: any) => ({ ...u, email: emailMap[u.host_user_id] || u.host_user_id }))
    }

    // Top 5 categories (by question set assignments)
    const { data: topCategories } = await supabase
      .from('question_set_categories')
      .select('category_id, count:question_set_id', { groupBy: 'category_id' })
      .order('count', { ascending: false })
      .limit(5)
    let topCategoriesWithName = []
    if (topCategories && topCategories.length > 0) {
      const catIds = topCategories.map((c: any) => c.category_id)
      const { data: cats } = await supabase.from('categories').select('id, name').in('id', catIds)
      const nameMap = Object.fromEntries((cats || []).map((c: any) => [c.id, c.name]))
      topCategoriesWithName = topCategories.map((c: any) => ({ ...c, name: nameMap[c.category_id] || c.category_id }))
    }

    return NextResponse.json({
      totalUsers, activeUsers, suspendedUsers,
      totalGames, activeGames,
      totalQuestionSets,
      newUsers, newGames, newQuestionSets,
      usersSeries: usersSeries || [],
      gamesSeries: gamesSeries || [],
      questionSetsSeries: questionSetsSeries || [],
      topUsers: topUsersWithEmail,
      topCategories: topCategoriesWithName,
    })
  })
} 