// ABOUTME: API route for searching Apple Music catalog
// ABOUTME: Handles song searches by term with pagination support

import { NextResponse } from 'next/server'
import { appleMusicClient } from '@/lib/apple-music'
import { APPLE_MUSIC_CONFIG } from '@/lib/apple-music/config'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const term = searchParams.get('term')
    const limit = parseInt(searchParams.get('limit') || '25')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    if (!term) {
      return NextResponse.json(
        { error: 'Search term is required' },
        { status: 400 }
      )
    }
    
    // Check if credentials are configured
    if (!APPLE_MUSIC_CONFIG.teamId || !APPLE_MUSIC_CONFIG.keyId || !APPLE_MUSIC_CONFIG.privateKey) {
      return NextResponse.json(
        { error: 'Apple Music API credentials not configured' },
        { status: 503 }
      )
    }
    
    const searchResults = await appleMusicClient.search({
      term,
      types: 'songs',
      limit,
      offset,
    })
    
    const songs = searchResults.results.songs?.data || []
    const hasMore = !!searchResults.results.songs?.next
    
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
    
    return NextResponse.json({ 
      songs: formattedSongs,
      hasMore
    })
  } catch (error) {
    console.error('Failed to search songs:', error)
    return NextResponse.json(
      { error: 'Failed to search songs' },
      { status: 500 }
    )
  }
}