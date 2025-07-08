import { NextRequest, NextResponse } from 'next/server'
import { requireAdminRoute, createServerClient, logAndHandleError } from '@/utils/supabase'

export async function GET(req: NextRequest) {
  return requireAdminRoute(req, async (user, supabase) => {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role, status, suspended_at, suspended_by, created_at')
      .order('created_at', { ascending: false })
    
    if (error) {
      const handledError = logAndHandleError('admin-users:get', error)
      return NextResponse.json(
        { error: handledError.message, type: handledError.type },
        { status: handledError.type === 'rls_violation' ? 403 : 500 }
      )
    }
    
    return NextResponse.json({ users: data })
  })
}

export async function PATCH(req: NextRequest) {
  return requireAdminRoute(req, async (adminUser, supabase) => {
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
      // Set suspended_by to current admin
      update.suspended_by = adminUser.id
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
    
    if (error) {
      const handledError = logAndHandleError('admin-users:patch', error)
      return NextResponse.json(
        { error: handledError.message, type: handledError.type },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ user: data, message })
  })
}

// POST/PATCH for user updates will be added next 