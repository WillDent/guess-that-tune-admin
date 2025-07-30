import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { errorHandler } from '@/lib/errors/handler'

export async function POST(request: NextRequest) {
  try {
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

    // Check if user already has prompts
    const { data: existingPrompts } = await supabase
      .from('ai_artwork_prompts')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)

    if (existingPrompts && existingPrompts.length > 0) {
      return NextResponse.json({
        message: 'User already has prompts',
        hasPrompts: true
      })
    }

    // Create default prompt
    const defaultPrompt = {
      user_id: user.id,
      name: 'Music Collection Default',
      description: 'Default prompt for music collections with dynamic elements',
      prompt_template: 'Create album cover artwork for a music collection. Style: {{style_description}} with {{color_description}}. {{theme_context}} {{visual_elements}} No text, words, or typography in the image. Focus on visual elements only.',
      variables: ['style_description', 'color_description', 'theme_context', 'visual_elements'],
      style: 'artistic',
      color_scheme: 'vibrant',
      is_active: true,
      is_default: true
    }

    const { data: prompt, error } = await supabase
      .from('ai_artwork_prompts')
      .insert(defaultPrompt)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      message: 'Default prompt created',
      prompt
    })
  } catch (error) {
    console.error('[AI Prompts Init] Error:', error)
    const appError = errorHandler.handle(error)
    return NextResponse.json(
      { error: errorHandler.getErrorMessage(appError) },
      { status: appError.statusCode }
    )
  }
}