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
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, description, created_at')
      .order('created_at', { ascending: false })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    await requireAdmin(supabase)
    const { data: { user } } = await supabase.auth.getUser()
    const body = await req.json()
    const { name, description } = body
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name, description, created_by: user.id }])
      .select('id, name, description, created_at')
      .single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 401 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    await requireAdmin(supabase)
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
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 401 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    await requireAdmin(supabase)
    const body = await req.json()
    const { id } = body
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 401 })
  }
} 