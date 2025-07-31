import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { errorHandler } from '@/lib/errors/handler'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    if (user.email !== 'will@dent.ly') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { data: prompt, error } = await (supabase as any)
      .from('ai_artwork_prompts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(prompt)
  } catch (error) {
    console.error('[AI Prompts GET] Error:', error)
    const appError = errorHandler.handle(error)
    return NextResponse.json(
      { error: errorHandler.getErrorMessage(appError) },
      { status: appError.statusCode }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    if (user.email !== 'will@dent.ly') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      description,
      prompt_template,
      variables,
      style,
      color_scheme,
      is_active,
      is_default
    } = body

    // If setting as default, unset other defaults
    if (is_default) {
      await (supabase as any)
        .from('ai_artwork_prompts')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true)
        .neq('id', id)
    }

    const { data: prompt, error } = await (supabase as any)
      .from('ai_artwork_prompts')
      .update({
        name,
        description,
        prompt_template,
        variables,
        style,
        color_scheme,
        is_active,
        is_default
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(prompt)
  } catch (error) {
    console.error('[AI Prompts PUT] Error:', error)
    const appError = errorHandler.handle(error)
    return NextResponse.json(
      { error: errorHandler.getErrorMessage(appError) },
      { status: appError.statusCode }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    if (user.email !== 'will@dent.ly') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { error } = await (supabase as any)
      .from('ai_artwork_prompts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[AI Prompts DELETE] Error:', error)
    const appError = errorHandler.handle(error)
    return NextResponse.json(
      { error: errorHandler.getErrorMessage(appError) },
      { status: appError.statusCode }
    )
  }
}