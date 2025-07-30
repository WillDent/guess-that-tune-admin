import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServerClient } from '@/lib/supabase/server'
import { errorHandler } from '@/lib/errors/handler'
import { rateLimiter } from '@/lib/errors/rate-limiter'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface SongData {
  id: string
  name: string
  artist: string
  album?: string
  genre?: string
}

interface SuggestionRequest {
  songs: SongData[]
  gameType: 'guess_artist' | 'guess_song'
  difficulty: 'easy' | 'medium' | 'hard'
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

    // Rate limiting - 10 requests per hour per user
    const rateLimitKey = `ai-suggestions:${user.id}`
    const { allowed, remaining } = await rateLimiter.check(rateLimitKey, 10, 3600)
    
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    // Parse request body
    const body: SuggestionRequest = await request.json()
    const { songs, gameType, difficulty } = body

    if (!songs || songs.length === 0) {
      return NextResponse.json(
        { error: 'No songs provided' },
        { status: 400 }
      )
    }

    // Prepare song list for prompt
    const songList = songs.map(s => `"${s.name}" by ${s.artist}`).join(', ')
    const artistList = [...new Set(songs.map(s => s.artist))].join(', ')
    
    // Detect common themes/genres
    const genres = songs.map(s => s.genre).filter(Boolean)
    const uniqueGenres = [...new Set(genres)]
    const genreText = uniqueGenres.length > 0 ? uniqueGenres.join(', ') : 'various genres'

    // Generate names
    const namePrompt = `Generate 5 creative, catchy names for a music quiz question set with these characteristics:
- Contains ${songs.length} songs: ${songList}
- Game Type: ${gameType === 'guess_artist' ? 'Players guess the artist' : 'Players guess the song title'}
- Difficulty: ${difficulty}
- Featured Artists: ${artistList}
- Genres: ${genreText}

Requirements:
- Names should be memorable and fun
- Reflect the musical theme or era
- Be appropriate for all ages
- Maximum 50 characters each
- Do not use generic terms like "Music Quiz" or "Song Test"

Format your response as a JSON object with a "names" array containing exactly 5 strings.
Example: {"names": ["Name 1", "Name 2", "Name 3", "Name 4", "Name 5"]}`

    // Generate description
    const descriptionPrompt = `Write an engaging, concise description for a music quiz featuring these songs:
${songList}

The description should:
- Summarize the musical theme in 1-2 sentences
- Mention 2-3 notable artists or songs without listing them all
- Include the time period if songs are from a specific era
- Be exciting and inviting for players
- MUST be under 200 characters (this is very important)
- Do not mention difficulty level or game type

Return only the description text, no quotes or formatting.`

    // Make parallel API calls for efficiency
    const [namesResponse, descriptionResponse] = await Promise.all([
      openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: namePrompt }],
        temperature: 0.8,
        max_tokens: 200,
        response_format: { type: 'json_object' }
      }),
      openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: descriptionPrompt }],
        temperature: 0.7,
        max_tokens: 100,
      })
    ])

    // Parse responses
    let names: string[] = []
    try {
      const namesContent = namesResponse.choices[0]?.message?.content || '{}'
      console.log('[AI Suggestions] Names response:', namesContent)
      
      // Try to parse as JSON
      const parsed = JSON.parse(namesContent)
      
      // Extract names array from various possible formats
      if (Array.isArray(parsed)) {
        names = parsed
      } else if (parsed.names && Array.isArray(parsed.names)) {
        names = parsed.names
      } else if (typeof parsed === 'object') {
        // Try to find any array in the object
        const arrays = Object.values(parsed).filter(v => Array.isArray(v))
        if (arrays.length > 0) {
          names = arrays[0] as string[]
        }
      }
      
      // Ensure we have valid strings
      names = names.filter(n => typeof n === 'string' && n.trim().length > 0)
      
    } catch (e) {
      console.error('Failed to parse names response:', e)
      console.error('Raw response was:', namesResponse.choices[0]?.message?.content)
      names = ['Musical Journey', 'Melody Masters', 'Beat Detective', 'Sound Safari', 'Rhythm Raiders']
    }

    // Ensure we have at least some names
    if (names.length === 0) {
      names = ['Musical Journey', 'Melody Masters', 'Beat Detective', 'Sound Safari', 'Rhythm Raiders']
    }

    let description = descriptionResponse.choices[0]?.message?.content?.trim() || 
      'Test your music knowledge with this exciting collection of songs!'
    
    console.log('[AI Suggestions] Description length:', description.length)
    
    // Ensure description is under 200 chars
    if (description.length > 200) {
      // Try to cut at a sentence boundary
      const sentences = description.match(/[^.!?]+[.!?]+/g) || [description]
      let truncated = ''
      for (const sentence of sentences) {
        if ((truncated + sentence).length <= 197) {
          truncated += sentence
        } else if (truncated.length === 0) {
          // First sentence is too long, just truncate
          truncated = description.slice(0, 197) + '...'
        }
        else {
          break
        }
      }
      description = truncated || description.slice(0, 197) + '...'
    }

    // Log usage for monitoring
    console.log(`[AI Suggestions] User ${user.id} generated suggestions for ${songs.length} songs`)
    console.log('[AI Suggestions] Returning names:', names.slice(0, 5))

    return NextResponse.json({
      names: names.slice(0, 5), // Ensure max 5 names
      description: description.trim(),
      remaining: remaining - 1
    })

  } catch (error) {
    console.error('[AI Suggestions] Error:', error)
    const appError = errorHandler.handle(error)
    return NextResponse.json(
      { error: errorHandler.getErrorMessage(appError) },
      { status: appError.statusCode }
    )
  }
}