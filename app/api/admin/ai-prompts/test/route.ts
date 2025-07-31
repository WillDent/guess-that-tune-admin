import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServerClient } from '@/lib/supabase/server'
import { errorHandler } from '@/lib/errors/handler'
import { rateLimiter } from '@/lib/errors/rate-limiter'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface TestRequest {
  promptId: string
  songs: Array<{
    id: string
    name: string
    artist: string
  }>
  userTheme?: string
  testVariables?: Record<string, string>
  style?: string
  colorScheme?: string
}

// Style and color descriptions (same as main generation)
const styleDescriptions = {
  abstract: 'abstract geometric shapes and patterns',
  realistic: 'photorealistic elements and textures',
  artistic: 'artistic painterly style with brush strokes',
  minimalist: 'minimalist clean design with simple shapes'
}

const colorDescriptions = {
  vibrant: 'bright vibrant colors with high contrast',
  dark: 'dark moody colors with deep shadows',
  pastel: 'soft pastel colors with gentle tones',
  monochrome: 'monochromatic black and white design'
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
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

    // Rate limiting - same as regular generation
    const isPro = false // TODO: Check user subscription status
    const dailyLimit = isPro ? 20 : 3
    const rateLimitKey = `ai-artwork:${user.id}`
    const { allowed, remaining } = await rateLimiter.check(rateLimitKey, dailyLimit, 86400)
    
    if (!allowed) {
      return NextResponse.json(
        { error: 'Daily limit reached. Upgrade to Pro for more generations.' },
        { status: 429 }
      )
    }

    // Parse request body
    const body: TestRequest = await request.json()
    const { promptId, songs, userTheme, testVariables, style, colorScheme } = body

    if (!songs || songs.length === 0) {
      return NextResponse.json(
        { error: 'No songs provided' },
        { status: 400 }
      )
    }

    // Fetch the prompt template
    const { data: promptTemplate, error: promptError } = await (supabase as any)
      .from('ai_artwork_prompts')
      .select('*')
      .eq('id', promptId)
      .eq('user_id', user.id)
      .single()

    if (promptError || !promptTemplate) {
      return NextResponse.json(
        { error: 'Prompt not found' },
        { status: 404 }
      )
    }

    // Use provided style/color or fall back to prompt defaults
    const appliedStyle = style || promptTemplate.style
    const appliedColorScheme = colorScheme || promptTemplate.color_scheme

    // Analyze test songs
    const artists = [...new Set(songs.map(s => s.artist))].slice(0, 3)
    const genres = ['Test Genre'] // For testing, we don't analyze genres
    
    // Build test variables
    const defaultTestVariables = {
      style_description: styleDescriptions[appliedStyle as keyof typeof styleDescriptions],
      color_description: colorDescriptions[appliedColorScheme as keyof typeof colorDescriptions],
      theme_context: userTheme ? `Additional theme: ${userTheme}.` : 'Modern music collection.',
      visual_elements: 'Include musical notes, instruments, rhythmic patterns.',
      artists: artists.join(', '),
      genres: genres.join(', '),
      song_count: songs.length.toString(),
      game_type: 'test'
    }

    // Merge with provided test variables
    const variables = { ...defaultTestVariables, ...testVariables }

    // Build prompt from template
    let prompt = promptTemplate.prompt_template
    Object.entries(variables).forEach(([key, value]) => {
      prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
    })

    console.log(`[AI Artwork Test] Generating with prompt: ${prompt}`)

    // Generate image
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      style: 'vivid'
    })

    const imageUrl = response.data?.[0]?.url
    
    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI')
    }

    // For testing, we return the OpenAI URL directly (expires in 1 hour)
    // We don't save to storage to avoid cluttering with test images
    console.log(`[AI Artwork Test] User ${user.id} generated test image for prompt ${promptId}`)

    return NextResponse.json({
      imageUrl: imageUrl,
      prompt: prompt.substring(0, 200) + '...', 
      remaining: remaining - 1,
      temporary: true,
      message: 'Test image generated. This URL will expire in 1 hour.'
    })

  } catch (error) {
    console.error('[AI Artwork Test] Error:', error)
    const appError = errorHandler.handle(error)
    return NextResponse.json(
      { error: errorHandler.getErrorMessage(appError) },
      { status: appError.statusCode }
    )
  }
}