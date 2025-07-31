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
    // TODO: Implement time_series_counts RPC function in the database
    // For now, return empty arrays to maintain API compatibility
    const usersSeries: any[] = []
    const gamesSeries: any[] = []
    const questionSetsSeries: any[] = []
    
    // const today = new Date();
    // const startDate = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
    // const startDateStr = startDate.toISOString().slice(0, 10);
    // // Users per day
    // const { data: usersSeries } = await supabase.rpc('time_series_counts', { table_name: 'users', start_date: startDateStr })
    // // Games per day
    // const { data: gamesSeries } = await supabase.rpc('time_series_counts', { table_name: 'games', start_date: startDateStr })
    // // Question sets per day
    // const { data: questionSetsSeries } = await supabase.rpc('time_series_counts', { table_name: 'question_sets', start_date: startDateStr })

    // Top 5 active users (by games hosted)
    // Since Supabase doesn't support groupBy in the client library, we'll get all games and aggregate in memory
    const { data: allGames } = await supabase
      .from('games')
      .select('host_id')
      .not('host_id', 'is', null)
    
    let topUsersWithEmail: Array<{ host_user_id: string; count: number; email: string }> = []
    if (allGames && allGames.length > 0) {
      // Count games by host_id
      const hostCounts = allGames.reduce((acc: Record<string, number>, game: any) => {
        if (game.host_id) {
          acc[game.host_id] = (acc[game.host_id] || 0) + 1
        }
        return acc
      }, {})
      
      // Get top 5 users
      const topUserIds = Object.entries(hostCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([userId]) => userId)
      
      // Get user emails
      const { data: users } = await supabase.from('users').select('id, email').in('id', topUserIds)
      const emailMap = Object.fromEntries((users || []).map(u => [u.id, u.email]))
      
      topUsersWithEmail = topUserIds.map(userId => ({
        host_user_id: userId,
        count: hostCounts[userId],
        email: emailMap[userId] || userId
      }))
    }

    // Top 5 categories (by question set assignments)
    // Similarly, aggregate in memory
    const { data: allCategories } = await supabase
      .from('question_set_categories')
      .select('category_id')
    
    let topCategoriesWithName: Array<{ category_id: string; count: number; name: string }> = []
    if (allCategories && allCategories.length > 0) {
      // Count by category_id
      const categoryCounts = allCategories.reduce((acc: Record<string, number>, item) => {
        acc[item.category_id] = (acc[item.category_id] || 0) + 1
        return acc
      }, {})
      
      // Get top 5 categories
      const topCategoryIds = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([categoryId]) => categoryId)
      
      // Get category names
      const { data: cats } = await supabase.from('categories').select('id, name').in('id', topCategoryIds)
      const nameMap = Object.fromEntries((cats || []).map(c => [c.id, c.name]))
      
      topCategoriesWithName = topCategoryIds.map(categoryId => ({
        category_id: categoryId,
        count: categoryCounts[categoryId],
        name: nameMap[categoryId] || categoryId
      }))
    }

    return NextResponse.json({
      totalUsers, activeUsers, suspendedUsers,
      totalGames, activeGames,
      totalQuestionSets,
      newUsers, newGames, newQuestionSets,
      usersSeries,
      gamesSeries,
      questionSetsSeries,
      topUsers: topUsersWithEmail,
      topCategories: topCategoriesWithName,
    })
  })
} 