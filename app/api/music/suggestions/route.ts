import { NextRequest, NextResponse } from 'next/server'
import { appleMusicClient } from '@/lib/apple-music'
import { errorHandler } from '@/lib/errors/handler'
import { APPLE_MUSIC_CONFIG } from '@/lib/apple-music/config'

export async function GET(req: NextRequest) {
  try {
    // Check if credentials are configured
    if (!APPLE_MUSIC_CONFIG.teamId || !APPLE_MUSIC_CONFIG.keyId || !APPLE_MUSIC_CONFIG.privateKey) {
      return NextResponse.json(
        { error: 'Apple Music API credentials not configured' },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(req.url)
    const term = searchParams.get('term')

    if (!term) {
      return NextResponse.json(
        { error: 'Search term is required' },
        { status: 400 }
      )
    }

    const suggestions = await appleMusicClient.getSearchSuggestions(term)

    // Format suggestions for frontend
    const formattedSuggestions = suggestions.map(suggestion => ({
      term: suggestion.searchTerm,
      display: suggestion.displayTerm,
      kind: suggestion.kind
    }))

    return NextResponse.json({ 
      suggestions: formattedSuggestions 
    })
  } catch (error) {
    const appError = errorHandler.handle(error)
    return NextResponse.json(
      { error: errorHandler.getErrorMessage(appError) },
      { status: appError.statusCode || 500 }
    )
  }
}