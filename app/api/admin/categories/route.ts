import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  console.log('START GET HANDLER')
  console.log('[API] GET /api/admin/categories')
  try {
    const supabase = await createServerClient()
    // Assume isAdmin is checked by middleware or session
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, description, created_at')
      .order('created_at', { ascending: false })
    if (error) {
      console.error('[API] GET error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('[API] GET exception:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  console.log('START POST HANDLER')
  console.log('[API] POST /api/admin/categories')
  try {
    const supabase = await createServerClient()
    console.log('POST HANDLER: Supabase client created')
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) {
      console.error('[API] POST user fetch error:', userError)
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }
    if (!user) {
      console.error('[API] POST: No authenticated user')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    console.log('[API] POST: Authenticated user', user.id)
    const body = await req.json()
    const { name, description } = body
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name, description, created_by: user.id }])
      .select('id, name, description, created_at')
      .single()
    if (error) {
      console.error('[API] POST error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('[API] POST exception:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  console.log('START PATCH HANDLER')
  console.log('[API] PATCH /api/admin/categories')
  try {
    const supabase = await createServerClient()
    const body = await req.json()
    const { id, name, description } = body
    if (!id || !name) return NextResponse.json({ error: 'ID and name are required' }, { status: 400 })
    const { data, error } = await supabase
      .from('categories')
      .update({ name, description })
      .eq('id', id)
      .select('id, name, description, created_at')
      .single()
    if (error) {
      console.error('[API] PATCH error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('[API] PATCH exception:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  console.log('START DELETE HANDLER')
  console.log('[API] DELETE /api/admin/categories')
  try {
    const supabase = await createServerClient()
    const body = await req.json()
    const { id } = body
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
    if (error) {
      console.error('[API] DELETE error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[API] DELETE exception:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
} 