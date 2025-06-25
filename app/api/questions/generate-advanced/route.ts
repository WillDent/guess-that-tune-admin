// ABOUTME: Advanced question generation API using diverse search strategies
// ABOUTME: Creates question sets from various music categories beyond basic genres

import { NextResponse } from 'next/server'
import { appleMusicClient } from '@/lib/apple-music'
import { APPLE_MUSIC_CONFIG } from '@/lib/apple-music/config'
import { generateQuestionSet } from '@/lib/question-generator'
import { 
  getAllStrategies, 
  executeRandomStrategy, 
  executeMixedStrategies,
  getTimeSpanSongs,
  getPopularitySongs 
} from '@/lib/apple-music/search-strategies'
import type { QuestionSetOptions } from '@/lib/question-generator'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      strategy = 'random',
      count = 10,
      difficulty = 'medium',
      numberOfDetractors = 3,
      mixStrategies = false,
      timeSpan,
      popularity
    } = body
    
    // Check credentials
    if (!APPLE_MUSIC_CONFIG.teamId || !APPLE_MUSIC_CONFIG.keyId || !APPLE_MUSIC_CONFIG.privateKey) {
      return NextResponse.json(
        { error: 'Apple Music API credentials not configured' },
        { status: 503 }
      )
    }
    
    let songs = []
    let categoryInfo = {}
    
    // Handle different generation strategies
    if (strategy === 'random') {
      // Use a random search strategy
      const result = await executeRandomStrategy()
      songs = result.songs
      categoryInfo = {
        category: result.strategy.category,
        description: result.strategy.description
      }
    } else if (strategy === 'mixed' || mixStrategies) {
      // Mix multiple strategies
      const result = await executeMixedStrategies(3)
      songs = result.songs
      categoryInfo = {
        category: 'Mixed Categories',
        description: 'Songs from multiple categories',
        strategies: result.strategies.map(s => ({
          name: s.category,
          description: s.description
        }))
      }
    } else if (strategy === 'timeSpan' && timeSpan) {
      // Get songs from a specific time period
      songs = await getTimeSpanSongs(timeSpan.startYear, timeSpan.endYear)
      categoryInfo = {
        category: `${timeSpan.startYear}-${timeSpan.endYear} Hits`,
        description: `Songs from ${timeSpan.startYear} to ${timeSpan.endYear}`
      }
    } else if (strategy === 'popularity' && popularity) {
      // Get songs by popularity type
      songs = await getPopularitySongs(popularity)
      categoryInfo = {
        category: `${popularity.charAt(0).toUpperCase() + popularity.slice(1)} Tracks`,
        description: `${popularity} music selections`
      }
    } else if (strategy === 'specific') {
      // Use a specific named strategy
      const allStrategies = getAllStrategies()
      const specificStrategy = allStrategies.find(s => s.name === body.strategyName)
      
      if (!specificStrategy) {
        return NextResponse.json(
          { error: 'Strategy not found' },
          { status: 400 }
        )
      }
      
      songs = await specificStrategy.execute()
      categoryInfo = {
        category: specificStrategy.category,
        description: specificStrategy.description
      }
    } else {
      // Default to chart-based generation
      const chartData = await appleMusicClient.getTopCharts({
        types: 'songs',
        limit: 100
      })
      songs = chartData.results.songs?.[0]?.data || []
      categoryInfo = {
        category: 'Top Charts',
        description: 'Current top chart hits'
      }
    }
    
    // Ensure we have enough songs
    if (songs.length < count + numberOfDetractors * 3) {
      return NextResponse.json(
        { error: 'Not enough songs found for the selected strategy' },
        { status: 400 }
      )
    }
    
    // Shuffle and select songs for questions
    const shuffled = songs.sort(() => Math.random() - 0.5)
    const selectedSongs = shuffled.slice(0, Math.min(count, shuffled.length))
    
    // Generate question sets
    const options: QuestionSetOptions = {
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      numberOfDetractors
    }
    
    const questions = generateQuestionSet(selectedSongs, songs, options)
    
    // Format response
    const formattedQuestions = questions.map((q, index) => {
      const correctSong = songs.find(s => s.id === q.correctSongId)
      const detractors = q.detractorIds.map(id => songs.find(s => s.id === id)).filter(Boolean)
      
      return {
        questionNumber: index + 1,
        correctAnswer: {
          id: correctSong?.id,
          name: correctSong?.attributes.name,
          artist: correctSong?.attributes.artistName,
          album: correctSong?.attributes.albumName,
          year: correctSong?.attributes.releaseDate 
            ? new Date(correctSong.attributes.releaseDate).getFullYear() 
            : null,
          previewUrl: correctSong?.attributes.previews?.[0]?.url || null,
          artwork: correctSong?.attributes.artwork.url
            .replace('{w}', '300')
            .replace('{h}', '300')
        },
        options: [correctSong, ...detractors]
          .filter(Boolean)
          .map(song => ({
            id: song.id,
            name: song.attributes.name,
            artist: song.attributes.artistName,
            album: song.attributes.albumName
          }))
          .sort(() => Math.random() - 0.5), // Shuffle options
        difficulty: q.difficulty
      }
    })
    
    return NextResponse.json({
      questions: formattedQuestions,
      metadata: {
        totalQuestions: formattedQuestions.length,
        ...categoryInfo,
        generationStrategy: strategy,
        difficulty
      }
    })
    
  } catch (error) {
    console.error('Failed to generate questions:', error)
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    )
  }
}

// GET endpoint to list available strategies
export async function GET() {
  const strategies = getAllStrategies()
  
  const categorized = {
    decade: strategies.filter(s => s.name.includes('60s') || s.name.includes('70s') || 
      s.name.includes('80s') || s.name.includes('90s') || s.name.includes('2000s') || 
      s.name.includes('2010s')),
    mood: strategies.filter(s => s.name.includes('workout') || s.name.includes('road') || 
      s.name.includes('summer') || s.name.includes('rainy') || s.name.includes('party')),
    regional: strategies.filter(s => s.name.includes('k-pop') || s.name.includes('latin') || 
      s.name.includes('bollywood') || s.name.includes('afro')),
    special: strategies.filter(s => s.name.includes('one-hit') || s.name.includes('movie') || 
      s.name.includes('tv') || s.name.includes('acoustic') || s.name.includes('remix') || 
      s.name.includes('duet') || s.name.includes('cover') || s.name.includes('grammy')),
    crossGenre: strategies.filter(s => s.name.includes('crossover') || s.name.includes('fusion') || 
      s.name.includes('folk-rock') || s.name.includes('rap-rock'))
  }
  
  return NextResponse.json({
    strategies: categorized,
    total: strategies.length,
    endpoints: {
      random: 'Uses a random strategy',
      mixed: 'Combines multiple strategies',
      timeSpan: 'Songs from a specific year range',
      popularity: 'Songs by popularity (viral, underground, mainstream)',
      specific: 'Use a specific strategy by name'
    }
  })
}