import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { errorHandler } from '@/lib/errors/handler'
import { rateLimiter } from '@/lib/errors/rate-limiter'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface ArtworkRequest {
  songs: Array<{
    id: string
    name: string
    artist: string
    album?: string
    genre?: string
  }>
  gameType: 'guess_artist' | 'guess_song'
  style?: 'abstract' | 'realistic' | 'artistic' | 'minimalist'
  colorScheme?: 'vibrant' | 'dark' | 'pastel' | 'monochrome'
  userTheme?: string
  promptId?: string // Use a specific prompt template
}

// Style descriptions for prompts
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

    // Rate limiting - 3 requests per day for free users, 20 for pro
    const isPro = false // TODO: Check user subscription status
    const dailyLimit = isPro ? 20 : 3
    const rateLimitKey = `ai-artwork:${user.id}`
    const { allowed, remaining } = await rateLimiter.check(rateLimitKey, dailyLimit, 86400) // 24 hours
    
    if (!allowed) {
      return NextResponse.json(
        { error: 'Daily limit reached. Upgrade to Pro for more generations.' },
        { status: 429 }
      )
    }

    // Parse request body
    const body: ArtworkRequest = await request.json()
    const { songs, gameType, style = 'artistic', colorScheme = 'vibrant', userTheme, promptId } = body

    if (!songs || songs.length === 0) {
      return NextResponse.json(
        { error: 'No songs provided' },
        { status: 400 }
      )
    }

    let prompt = ''
    let promptTemplate = null
    let appliedStyle = style
    let appliedColorScheme = colorScheme

    // Check if user wants to use a custom prompt
    if (promptId) {
      const { data: customPrompt, error: promptError } = await (supabase as any)
        .from('ai_artwork_prompts')
        .select('*')
        .eq('id', promptId)
        .eq('is_active', true)
        .single()

      if (!promptError && customPrompt) {
        promptTemplate = customPrompt
        appliedStyle = customPrompt.style
        appliedColorScheme = customPrompt.color_scheme
        
        // Update usage count
        await (supabase as any)
          .from('ai_artwork_prompts')
          .update({ usage_count: customPrompt.usage_count + 1 })
          .eq('id', promptId)
      }
    }

    // If no custom prompt or not found, check for default
    if (!promptTemplate) {
      const { data: defaultPrompt } = await (supabase as any)
        .from('ai_artwork_prompts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .eq('is_active', true)
        .single()

      if (defaultPrompt) {
        promptTemplate = defaultPrompt
        appliedStyle = style || defaultPrompt.style // Allow override
        appliedColorScheme = colorScheme || defaultPrompt.color_scheme // Allow override
      }
    }

    // Analyze songs for common themes
    const artists = [...new Set(songs.map(s => s.artist))].slice(0, 3)
    const genres = [...new Set(songs.map(s => s.genre).filter(Boolean))]
    
    // Detect era based on common patterns (this is simplified)
    let era = ''
    const songNames = songs.map(s => s.name.toLowerCase()).join(' ')
    if (songNames.includes('disco') || artists.some(a => a.toLowerCase().includes('bee gees'))) {
      era = '70s disco'
    } else if (songNames.includes('rock') && (songNames.includes('80') || songNames.includes('eighties'))) {
      era = '80s rock'
    } else if (genres.includes('classical')) {
      era = 'classical'
    } else if (genres.includes('jazz')) {
      era = 'jazz'
    }

    // Build theme context
    let themeContext = ''
    if (era) {
      themeContext = `Theme: ${era} music aesthetics.`
    } else if (genres.length > 0) {
      themeContext = `Genre: ${genres.join(', ')} music.`
    } else {
      themeContext = 'Modern music collection.'
    }

    // Add user theme if provided
    if (userTheme) {
      themeContext += ` Additional theme: ${userTheme}.`
    }

    // Build visual elements based on genre/era
    let visualElements = ''
    if (era === '80s rock') {
      visualElements = 'Include neon lights, electric guitars, geometric shapes.'
    } else if (era === '70s disco') {
      visualElements = 'Include disco balls, sparkles, groovy patterns.'
    } else if (era === 'classical') {
      visualElements = 'Include orchestral instruments, sheet music elements, elegant composition.'
    } else if (genres.includes('electronic')) {
      visualElements = 'Include synthesizers, waveforms, digital patterns.'
    } else {
      visualElements = 'Include musical notes, instruments, rhythmic patterns.'
    }

    // Use template if available, otherwise fallback to default
    if (promptTemplate && promptTemplate.prompt_template) {
      // Replace variables in template
      const variables = {
        style_description: styleDescriptions[appliedStyle],
        color_description: colorDescriptions[appliedColorScheme],
        theme_context: themeContext,
        visual_elements: visualElements,
        artists: artists.join(', '),
        genres: genres.join(', '),
        song_count: songs.length.toString(),
        game_type: gameType
      }

      prompt = promptTemplate.prompt_template
      Object.entries(variables).forEach(([key, value]) => {
        prompt = prompt.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
      })
    } else {
      // Fallback to original prompt building
      prompt = `Create album cover artwork for a music collection. `
      prompt += `Style: ${styleDescriptions[appliedStyle]} with ${colorDescriptions[appliedColorScheme]}. `
      prompt += `${themeContext} `
      prompt += `${visualElements} `
      prompt += 'No text, words, or typography in the image. Focus on visual elements only.'
    }

    console.log(`[AI Artwork] Generating with prompt: ${prompt}`)

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

    // Enable storage upload to prevent broken images
    const SKIP_STORAGE_UPLOAD = false // Upload to storage for permanent URLs
    
    if (SKIP_STORAGE_UPLOAD) {
      console.log('[AI Artwork] Skipping storage upload, returning OpenAI URL directly')
      return NextResponse.json({
        imageUrl: imageUrl,
        prompt: prompt.substring(0, 200) + '...', 
        remaining: remaining - 1,
        temporary: true // Flag to indicate this is a temporary URL
      })
    }

    // Download and upload to Supabase Storage
    const imageResponse = await fetch(imageUrl)
    const imageBlob = await imageResponse.blob()
    // Use path format that matches RLS policy: user_id/path/filename
    const fileName = `${user.id}/ai-artwork/${Date.now()}.png`
    
    // Try to upload with user's session first
    let uploadError = null
    let uploadData = null
    
    const { data, error } = await supabase.storage
      .from('question-set-artwork')
      .upload(fileName, imageBlob, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      })
    
    uploadData = data
    uploadError = error

    // If RLS policy blocks upload, try with path that matches policy
    if (uploadError && uploadError.message?.includes('row-level security policy')) {
      console.log('[AI Artwork] RLS policy blocked upload, trying with correct path format...')
      
      // The RLS policy expects the user ID as the first folder in the path
      const policyCompliantFileName = `${user.id}/ai-artwork/${Date.now()}.png`
      
      const retryResult = await supabase.storage
        .from('question-set-artwork')
        .upload(policyCompliantFileName, imageBlob, {
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: false
        })
      
      if (retryResult.error) {
        console.error('[AI Artwork] Retry upload error:', retryResult.error)
        throw new Error('Failed to upload generated image. Please check storage permissions.')
      }
      
      uploadData = retryResult.data
      uploadError = null
    } else if (uploadError) {
      console.error('[AI Artwork] Upload error:', uploadError)
      throw new Error('Failed to upload generated image')
    }

    // Get public URL
    const uploadedPath = uploadData?.path || fileName
    const { data: { publicUrl } } = supabase.storage
      .from('question-set-artwork')
      .getPublicUrl(uploadedPath)

    // Log usage
    console.log(`[AI Artwork] User ${user.id} generated artwork for ${songs.length} songs`)

    return NextResponse.json({
      imageUrl: publicUrl,
      prompt: prompt.substring(0, 200) + '...', // Truncated for response
      remaining: remaining - 1
    })

  } catch (error) {
    console.error('[AI Artwork] Error:', error)
    const appError = errorHandler.handle(error)
    return NextResponse.json(
      { error: errorHandler.getErrorMessage(appError) },
      { status: appError.statusCode }
    )
  }
}