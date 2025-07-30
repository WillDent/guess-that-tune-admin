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

    // Create default prompts for new users
    const defaultPrompts = [
      {
        user_id: user.id,
        name: 'Classic Album Cover',
        description: 'Traditional album cover style with musical elements',
        prompt_template: 'Create album cover artwork for a music collection. Style: {{style_description}} with {{color_description}}. {{theme_context}} {{visual_elements}} No text, words, or typography in the image. Focus on visual elements only.',
        variables: ['style_description', 'color_description', 'theme_context', 'visual_elements'],
        style: 'artistic',
        color_scheme: 'vibrant',
        is_active: true,
        is_default: true
      },
      {
        user_id: user.id,
        name: 'Minimalist Modern',
        description: 'Clean, modern design with abstract elements',
        prompt_template: 'Design a minimalist album cover. {{color_description}} abstract design. {{theme_context}} Use simple geometric shapes and negative space. {{visual_elements}} No text or typography.',
        variables: ['color_description', 'theme_context', 'visual_elements'],
        style: 'minimalist',
        color_scheme: 'monochrome',
        is_active: true,
        is_default: false
      },
      {
        user_id: user.id,
        name: 'Retro Vintage',
        description: 'Nostalgic, vintage-inspired artwork',
        prompt_template: 'Create vintage-style album artwork with retro aesthetics. {{style_description}} with {{color_description}}. {{theme_context}} Include vintage textures, grain, and nostalgic elements. {{visual_elements}} No text, maintain authentic vintage look.',
        variables: ['style_description', 'color_description', 'theme_context', 'visual_elements'],
        style: 'artistic',
        color_scheme: 'pastel',
        is_active: true,
        is_default: false
      }
    ]

    const { data: prompts, error } = await supabase
      .from('ai_artwork_prompts')
      .insert(defaultPrompts)
      .select()

    if (error) {
      throw error
    }

    return NextResponse.json({
      message: 'Default prompts created',
      prompts
    })
  } catch (error) {
    console.error('[User Prompts Init] Error:', error)
    const appError = errorHandler.handle(error)
    return NextResponse.json(
      { error: errorHandler.getErrorMessage(appError) },
      { status: appError.statusCode }
    )
  }
}