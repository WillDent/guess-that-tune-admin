import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  // Assume isAdmin is checked by middleware or session
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, description, created_at')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const body = await req.json()
  const { name, description } = body
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  const { data, error } = await supabase
    .from('categories')
    .insert([{ name, description }])
    .select('id, name, description, created_at')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const supabase = createServerClient()
  const body = await req.json()
  const { id, name, description } = body
  if (!id || !name) return NextResponse.json({ error: 'ID and name are required' }, { status: 400 })
  const { data, error } = await supabase
    .from('categories')
    .update({ name, description })
    .eq('id', id)
    .select('id, name, description, created_at')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerClient()
  const body = await req.json()
  const { id } = body
  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
} 