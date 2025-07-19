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
    const types = searchParams.get('types')?.split(',') || ['mood', 'activity']
    const limit = parseInt(searchParams.get('limit') || '25')
    const offset = parseInt(searchParams.get('offset') || '0')

    const playlists = await appleMusicClient.getPlaylists({
      types,
      limit,
      offset
    })

    // Map to simplified format for frontend
    const formattedPlaylists = playlists.map(playlist => ({
      id: playlist.id,
      name: playlist.attributes.name,
      description: playlist.attributes.description?.short || playlist.attributes.description?.standard || '',
      curator: playlist.attributes.curatorName || 'Apple Music',
      trackCount: playlist.attributes.trackCount || 0,
      artwork: playlist.attributes.artwork ? {
        url: playlist.attributes.artwork.url
          .replace('{w}', '300')
          .replace('{h}', '300'),
        bgColor: playlist.attributes.artwork.bgColor,
        textColor: playlist.attributes.artwork.textColor1
      } : null,
      isChart: playlist.attributes.isChart,
      playlistType: playlist.attributes.playlistType,
      lastModified: playlist.attributes.lastModifiedDate
    }))

    return NextResponse.json({ 
      playlists: formattedPlaylists,
      total: formattedPlaylists.length 
    })
  } catch (error) {
    const appError = errorHandler.handle(error)
    return NextResponse.json(
      { error: errorHandler.getErrorMessage(appError) },
      { status: appError.statusCode || 500 }
    )
  }
}