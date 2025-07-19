import { NextRequest, NextResponse } from 'next/server'
import { appleMusicClient } from '@/lib/apple-music'
import { errorHandler } from '@/lib/errors/handler'
import { APPLE_MUSIC_CONFIG } from '@/lib/apple-music/config'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check if credentials are configured
    if (!APPLE_MUSIC_CONFIG.teamId || !APPLE_MUSIC_CONFIG.keyId || !APPLE_MUSIC_CONFIG.privateKey) {
      return NextResponse.json(
        { error: 'Apple Music API credentials not configured' },
        { status: 503 }
      )
    }

    const params = await context.params
    const playlistId = params.id
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const tracks = await appleMusicClient.getPlaylistTracks(
      playlistId,
      'us',
      limit,
      offset
    )

    // Map to simplified format matching existing song format
    const songs = tracks.map(track => ({
      id: track.id,
      name: track.attributes.name,
      artist: track.attributes.artistName,
      album: track.attributes.albumName,
      year: new Date(track.attributes.releaseDate).getFullYear().toString(),
      genre: track.attributes.genreNames[0] || 'Unknown',
      previewUrl: track.attributes.previews?.[0]?.url || null,
      artwork: track.attributes.artwork.url
        .replace('{w}', '300')
        .replace('{h}', '300'),
      durationMs: track.attributes.durationInMillis
    }))

    return NextResponse.json({ 
      songs,
      total: songs.length 
    })
  } catch (error) {
    const appError = errorHandler.handle(error)
    return NextResponse.json(
      { error: errorHandler.getErrorMessage(appError) },
      { status: appError.statusCode || 500 }
    )
  }
}