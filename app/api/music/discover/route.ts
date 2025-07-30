import { NextRequest, NextResponse } from 'next/server'
import { musicDiscoveryService } from '@/lib/apple-music/discovery-service'
import { errorHandler } from '@/lib/errors/handler'
import { APPLE_MUSIC_CONFIG } from '@/lib/apple-music/config'
import type { AdvancedSearchParams } from '@/lib/apple-music/discovery-service'

export async function POST(req: NextRequest) {
  try {
    // Check if credentials are configured
    if (!APPLE_MUSIC_CONFIG.teamId || !APPLE_MUSIC_CONFIG.keyId || !APPLE_MUSIC_CONFIG.privateKey) {
      return NextResponse.json(
        { error: 'Apple Music API credentials not configured' },
        { status: 503 }
      )
    }

    const body = await req.json()
    const params: AdvancedSearchParams = {
      theme: body.theme,
      year: body.year,
      yearRange: body.yearRange,
      decade: body.decade,
      genre: body.genre,
      mood: body.mood,
      tempo: body.tempo,
      explicit: body.explicit,
      limit: body.limit || 50
    }

    // Validate parameters
    if (!params.theme && !params.genre && !params.mood) {
      return NextResponse.json(
        { error: 'At least one of theme, genre, or mood is required' },
        { status: 400 }
      )
    }

    console.log('[Music Discover API] Request params:', params)

    const result = await musicDiscoveryService.discoverSongs(params)

    // Format songs for frontend
    const formattedSongs = result.songs.map(song => ({
      id: song.id,
      name: song.attributes.name,
      artist: song.attributes.artistName,
      album: song.attributes.albumName,
      year: new Date(song.attributes.releaseDate).getFullYear().toString(),
      genre: song.attributes.genreNames[0] || 'Unknown',
      previewUrl: song.attributes.previews?.[0]?.url || null,
      artwork: song.attributes.artwork.url.replace('{w}', '300').replace('{h}', '300'),
      durationMs: song.attributes.durationInMillis,
      isExplicit: song.attributes.contentRating === 'explicit'
    }))

    return NextResponse.json({
      songs: formattedSongs,
      totalResults: result.totalResults,
      sources: result.sources,
      searchQuery: result.searchQuery
    })
  } catch (error) {
    console.error('[Music Discover API] Error:', error)
    const appError = errorHandler.handle(error)
    return NextResponse.json(
      { error: errorHandler.getErrorMessage(appError) },
      { status: appError.statusCode || 500 }
    )
  }
}

// GET endpoint for preset discoveries
export async function GET(req: NextRequest) {
  const presets = [
    {
      id: 'love-80s',
      name: '80s Love Songs',
      description: 'Romantic hits from the 1980s',
      params: { theme: 'love', decade: '1980s' }
    },
    {
      id: 'party-90s',
      name: '90s Party Hits',
      description: 'Dance and party songs from the 90s',
      params: { theme: 'party', decade: '1990s' }
    },
    {
      id: 'wedding-classics',
      name: 'Wedding Classics',
      description: 'Timeless songs for your special day',
      params: { theme: 'wedding', explicit: false }
    },
    {
      id: 'workout-2000s',
      name: '2000s Workout',
      description: 'High energy hits from the 2000s',
      params: { theme: 'workout', decade: '2000s' }
    },
    {
      id: 'chill-rb',
      name: 'Chill R&B',
      description: 'Smooth R&B tracks to relax to',
      params: { theme: 'chill', genre: 'R&B' }
    },
    {
      id: 'happy-pop',
      name: 'Happy Pop Hits',
      description: 'Upbeat pop songs to boost your mood',
      params: { theme: 'happy', genre: 'Pop' }
    }
  ]

  return NextResponse.json({ presets })
}