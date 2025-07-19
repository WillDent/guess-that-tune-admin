// ABOUTME: API route for fetching Apple Music charts (Top 100)
// ABOUTME: Returns formatted song data from Apple Music API

import { NextResponse } from 'next/server'
import { appleMusicClient } from '@/lib/apple-music'
import { APPLE_MUSIC_CONFIG } from '@/lib/apple-music/config'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const genre = searchParams.get('genre') || undefined
    const storefront = searchParams.get('storefront') || 'us'
    const limit = parseInt(searchParams.get('limit') || '100')
    
    // Check if credentials are configured
    if (!APPLE_MUSIC_CONFIG.teamId || !APPLE_MUSIC_CONFIG.keyId || !APPLE_MUSIC_CONFIG.privateKey) {
      return NextResponse.json(
        { error: 'Apple Music API credentials not configured' },
        { status: 503 }
      )
    }
    
    const chartData = await appleMusicClient.getTopCharts({
      storefront,
      types: 'songs',
      genre,
      limit,
    })
    
    const songs = chartData.results.songs?.[0]?.data || []
    
    const formattedSongs = songs.map(song => ({
      id: song.id,
      name: song.attributes.name,
      artist: song.attributes.artistName,
      album: song.attributes.albumName,
      year: new Date(song.attributes.releaseDate).getFullYear().toString(),
      genre: song.attributes.genreNames[0] || 'Unknown',
      previewUrl: song.attributes.previews?.[0]?.url || null,
      artwork: song.attributes.artwork.url.replace('{w}', '300').replace('{h}', '300'),
      durationMs: song.attributes.durationInMillis,
    }))
    
    return NextResponse.json({ songs: formattedSongs })
  } catch (error) {
    console.error('Failed to fetch charts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch charts' },
      { status: 500 }
    )
  }
}