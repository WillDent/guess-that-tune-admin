import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// Only allow admins
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
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role, status, suspended_at, suspended_by, created_at')
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ users: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    await requireAdmin(supabase)
    const { id, action } = await req.json()
    if (!id || !action) throw new Error('Missing id or action')

    let update: any = {}
    let message = ''
    if (action === 'promote') {
      update.role = 'admin'
      message = 'User promoted to admin.'
    } else if (action === 'demote') {
      update.role = 'user'
      message = 'User demoted to user.'
    } else if (action === 'suspend') {
      update.status = 'suspended'
      update.suspended_at = new Date().toISOString()
      // Optionally: set suspended_by to current admin
      const {
        data: { user },
      } = await supabase.auth.getUser()
      update.suspended_by = user.id
      message = 'User suspended.'
    } else if (action === 'activate') {
      update.status = 'active'
      update.suspended_at = null
      update.suspended_by = null
      message = 'User activated.'
    } else {
      throw new Error('Invalid action')
    }

    const { data, error } = await supabase
      .from('users')
      .update(update)
      .eq('id', id)
      .select('id, email, role, status, suspended_at, suspended_by, created_at')
      .single()
    if (error) throw error
    return NextResponse.json({ user: data, message })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
  }
}

// POST/PATCH for user updates will be added next 