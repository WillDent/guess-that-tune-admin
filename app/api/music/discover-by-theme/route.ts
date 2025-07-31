// API endpoint for discovering songs based on themes using OpenAI
// Combines AI suggestions with Apple Music catalog matching

import { NextResponse } from 'next/server'
import { themeDiscoveryService } from '@/lib/openai/theme-service'
import { songMatcher } from '@/lib/apple-music/song-matcher'
import { requireAuth } from '@/lib/auth/server'
import { errorHandler } from '@/lib/errors/handler'
import type { ThemeSearchRequest } from '@/lib/openai/theme-service'

export async function POST(request: Request) {
  try {
    // Authenticate user
    const user = await requireAuth()
    
    const body = await request.json()
    const { theme, description, constraints } = body as ThemeSearchRequest
    
    if (!theme || theme.trim().length === 0) {
      return NextResponse.json(
        { error: 'Theme is required' },
        { status: 400 }
      )
    }

    console.log(`[ThemeDiscovery] User ${user.id} searching for theme: "${theme}"`)

    // Step 1: Get song suggestions from OpenAI
    const aiResponse = await themeDiscoveryService.discoverSongsByTheme({
      theme,
      description,
      constraints
    })

    // Step 2: Match suggestions with Apple Music catalog
    const matchingResult = await songMatcher.matchSongs(aiResponse.suggestions)

    // Step 3: Format response
    const response = {
      theme: aiResponse.theme,
      interpretation: aiResponse.interpretation,
      searchStrategy: aiResponse.searchStrategy,
      matches: matchingResult.matches.map(match => ({
        suggestion: {
          title: match.suggestion.title,
          artist: match.suggestion.artist,
          reason: match.suggestion.reason,
          confidence: match.suggestion.confidence
        },
        appleMusicSong: match.appleMusicSong ? {
          id: match.appleMusicSong.id,
          name: match.appleMusicSong.attributes.name,
          artist: match.appleMusicSong.attributes.artistName,
          album: match.appleMusicSong.attributes.albumName,
          artwork: match.appleMusicSong.attributes.artwork.url
            .replace('{w}', '300')
            .replace('{h}', '300'),
          previewUrl: match.appleMusicSong.attributes.previews?.[0]?.url || null,
          year: new Date(match.appleMusicSong.attributes.releaseDate).getFullYear(),
          genre: match.appleMusicSong.attributes.genreNames[0] || 'Unknown',
          durationMs: match.appleMusicSong.attributes.durationInMillis,
          isExplicit: match.appleMusicSong.attributes.contentRating === 'explicit'
        } : null,
        matchConfidence: match.matchConfidence,
        matchStrategy: match.matchStrategy
      })),
      summary: {
        totalSuggestions: matchingResult.totalSuggestions,
        matchedCount: matchingResult.matchedCount,
        successRate: matchingResult.successRate,
        unmatchedCount: matchingResult.totalSuggestions - matchingResult.matchedCount
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[ThemeDiscovery] Error:', error)
    const appError = errorHandler.handle(error)
    return NextResponse.json(
      { error: errorHandler.getErrorMessage(appError) },
      { status: appError.statusCode }
    )
  }
}

// Validate a theme before full discovery
export async function GET(request: Request) {
  try {
    await requireAuth()
    
    const { searchParams } = new URL(request.url)
    const theme = searchParams.get('theme')
    
    if (!theme) {
      return NextResponse.json(
        { error: 'Theme parameter is required' },
        { status: 400 }
      )
    }

    const validation = await themeDiscoveryService.validateTheme(theme)
    
    return NextResponse.json(validation)
  } catch (error) {
    console.error('[ThemeDiscovery] Validation error:', error)
    const appError = errorHandler.handle(error)
    return NextResponse.json(
      { error: errorHandler.getErrorMessage(appError) },
      { status: appError.statusCode }
    )
  }
}