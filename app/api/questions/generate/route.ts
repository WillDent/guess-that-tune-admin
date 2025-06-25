// ABOUTME: API endpoint for generating question sets with detractors
// ABOUTME: Uses similarity algorithm to select appropriate wrong answers

import { NextResponse } from 'next/server'
import { appleMusicClient } from '@/lib/apple-music'
import { generateQuestionSet } from '@/lib/question-generator'
import { APPLE_MUSIC_CONFIG } from '@/lib/apple-music/config'

export async function POST(request: Request) {
  try {
    // Check if credentials are configured
    if (!APPLE_MUSIC_CONFIG.teamId || !APPLE_MUSIC_CONFIG.keyId || !APPLE_MUSIC_CONFIG.privateKey) {
      return NextResponse.json(
        { error: 'Apple Music API credentials not configured' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { selectedSongIds, difficulty = 'medium' } = body

    if (!selectedSongIds || selectedSongIds.length === 0) {
      return NextResponse.json(
        { error: 'No songs selected' },
        { status: 400 }
      )
    }

    // Fetch the selected songs
    const selectedSongs = await appleMusicClient.getSongs(selectedSongIds)
    
    // For each selected song, we need to find potential detractors
    // We'll search for songs in the same genre and era
    const allCandidates = new Map()
    
    for (const song of selectedSongs) {
      try {
        // Get songs from the same genre
        const genre = song.attributes.genreNames[0] || 'Rock'
        const year = new Date(song.attributes.releaseDate).getFullYear()
        const decade = Math.floor(year / 10) * 10
        
        // Build search term - make sure it's not empty
        const searchTermParts = []
        if (genre) {
          // Remove special characters that might break the search
          const cleanGenre = genre.replace(/[\/\-]/g, ' ').trim()
          searchTermParts.push(cleanGenre)
        }
        if (decade && decade > 1900) {
          searchTermParts.push(`${decade}s`)
        }
        
        const searchTerm = searchTermParts.join(' ') || 'music'
        
        console.log(`Searching for similar songs: "${searchTerm}"`)
        
        const searchResults = await appleMusicClient.search({
          term: searchTerm,
          types: 'songs',
          limit: 50
        })
        
        // Add to candidate pool
        for (const candidate of searchResults.results.songs?.data || []) {
          if (!allCandidates.has(candidate.id)) {
            allCandidates.set(candidate.id, candidate)
          }
        }
      } catch (searchError) {
        console.error(`Failed to search for song ${song.id}:`, searchError)
        // Continue with other songs
      }
    }
    
    // Convert to array and remove selected songs
    const selectedIds = new Set(selectedSongIds)
    const candidatePool = Array.from(allCandidates.values())
      .filter(song => !selectedIds.has(song.id))
    
    console.log(`Found ${candidatePool.length} candidate songs for detractors`)
    
    // If we don't have enough candidates, fetch more from general charts
    if (candidatePool.length < 30) {
      console.log('Not enough candidates, fetching from Top 100...')
      const chartData = await appleMusicClient.getTopCharts({
        types: 'songs',
        limit: 100
      })
      
      for (const chartSong of chartData.results.songs?.[0]?.data || []) {
        if (!selectedIds.has(chartSong.id) && !allCandidates.has(chartSong.id)) {
          candidatePool.push(chartSong)
        }
      }
    }
    
    // Generate question sets
    const questions = generateQuestionSet(
      selectedSongs,
      candidatePool,
      {
        difficulty,
        numberOfDetractors: 3
      }
    )
    
    // Format the response with full song data
    const formattedQuestions = questions.map(q => {
      const correctSong = selectedSongs.find(s => s.id === q.correctSongId)!
      const detractorSongs = q.detractorIds
        .map(id => candidatePool.find(s => s.id === id)!)
        .filter(Boolean)
      
      return {
        correctSong: {
          id: correctSong.id,
          name: correctSong.attributes.name,
          artist: correctSong.attributes.artistName,
          album: correctSong.attributes.albumName,
          artwork: correctSong.attributes.artwork.url.replace('{w}', '300').replace('{h}', '300'),
          previewUrl: correctSong.attributes.previews?.[0]?.url
        },
        detractors: detractorSongs.map(song => ({
          id: song.id,
          name: song.attributes.name,
          artist: song.attributes.artistName,
          album: song.attributes.albumName,
          artwork: song.attributes.artwork.url.replace('{w}', '300').replace('{h}', '300')
        })),
        difficulty
      }
    })
    
    return NextResponse.json({ 
      questions: formattedQuestions,
      totalQuestions: formattedQuestions.length
    })
  } catch (error) {
    console.error('Failed to generate questions:', error)
    return NextResponse.json(
      { error: 'Failed to generate question set' },
      { status: 500 }
    )
  }
}