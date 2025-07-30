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
    const { songs, gameType, style = 'artistic', colorScheme = 'vibrant', userTheme } = body

    if (!songs || songs.length === 0) {
      return NextResponse.json(
        { error: 'No songs provided' },
        { status: 400 }
      )
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

    // Build the prompt
    let prompt = `Create album cover artwork for a music collection. `
    
    // Add style and color
    prompt += `Style: ${styleDescriptions[style]} with ${colorDescriptions[colorScheme]}. `
    
    // Add musical context
    if (era) {
      prompt += `Theme: ${era} music aesthetics. `
    } else if (genres.length > 0) {
      prompt += `Genre: ${genres.join(', ')} music. `
    } else {
      prompt += `Modern music collection. `
    }
    
    // Add user theme if provided
    if (userTheme) {
      prompt += `Additional theme: ${userTheme}. `
    }
    
    // Add visual elements based on genre/era
    if (era === '80s rock') {
      prompt += 'Include neon lights, electric guitars, geometric shapes. '
    } else if (era === '70s disco') {
      prompt += 'Include disco balls, sparkles, groovy patterns. '
    } else if (era === 'classical') {
      prompt += 'Include orchestral instruments, sheet music elements, elegant composition. '
    } else if (genres.includes('electronic')) {
      prompt += 'Include synthesizers, waveforms, digital patterns. '
    } else {
      prompt += 'Include musical notes, instruments, rhythmic patterns. '
    }
    
    // Always end with no text instruction
    prompt += 'No text, words, or typography in the image. Focus on visual elements only.'

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

    // TEMPORARY: Return OpenAI URL directly to avoid storage issues
    const SKIP_STORAGE_UPLOAD = true // Skip storage upload for now
    
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
    const fileName = `ai-artwork-${user.id}-${Date.now()}.png`
    
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

    // If RLS policy blocks upload, try with service role (if available)
    if (uploadError && uploadError.message?.includes('row-level security policy')) {
      console.log('[AI Artwork] RLS policy blocked upload, trying alternative method...')
      
      // For now, we'll create a simpler file path that might work better with policies
      const simplifiedFileName = `ai/${user.id}/${Date.now()}.png`
      
      const retryResult = await supabase.storage
        .from('question-set-artwork')
        .upload(simplifiedFileName, imageBlob, {
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: true // Allow overwriting in case of conflicts
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