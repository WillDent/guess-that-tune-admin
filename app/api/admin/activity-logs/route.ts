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
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user')
    let query = supabase
      .from('activity_logs')
      .select('id, user_id, action_type, details, created_at, ip_address', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(100)
    if (userId) {
      query = query.eq('user_id', userId)
    }
    const { data, error } = await query
    if (error) throw error
    // Optionally join user email
    let usersMap: Record<string, string> = {}
    if (data && data.length > 0) {
      const userIds = Array.from(new Set(data.map((log: any) => log.user_id).filter(Boolean)))
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, email')
          .in('id', userIds)
        if (users) {
          usersMap = Object.fromEntries(users.map((u: any) => [u.id, u.email]))
        }
      }
    }
    return NextResponse.json({ logs: data, usersMap })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 })
  }
} 