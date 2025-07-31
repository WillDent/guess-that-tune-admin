// API endpoint for generating question sets directly from AI theme discovery
// Combines theme research, song matching, and question generation in one flow

import { NextResponse } from 'next/server'
import { themeDiscoveryService } from '@/lib/openai/theme-service'
import { songMatcher } from '@/lib/apple-music/song-matcher'
import { generateQuestionSet } from '@/lib/question-generator'
import { requireAuth } from '@/lib/auth/server'
import { errorHandler } from '@/lib/errors/handler'
import { createServerClient } from '@/lib/supabase/server'
import { GameType, GAME_TYPES } from '@/types/game-type'
import type { ThemeSearchRequest } from '@/lib/openai/theme-service'

export async function POST(request: Request) {
  try {
    // Authenticate user
    const user = await requireAuth()
    const supabase = await createServerClient()
    
    const body = await request.json()
    const { 
      theme, 
      description, 
      constraints,
      questionSetName,
      difficulty = 'medium',
      gameType = GAME_TYPES.GUESS_ARTIST,
      saveToDatabase = false
    } = body
    
    if (!theme || theme.trim().length === 0) {
      return NextResponse.json(
        { error: 'Theme is required' },
        { status: 400 }
      )
    }

    console.log(`[ThemeQuestionGen] User ${user.id} generating questions for theme: "${theme}"`)

    // Step 1: Get song suggestions from OpenAI
    const aiResponse = await themeDiscoveryService.discoverSongsByTheme({
      theme,
      description,
      constraints: {
        ...constraints,
        count: constraints?.count || 20
      }
    })

    // Step 2: Match suggestions with Apple Music catalog
    const matchingResult = await songMatcher.matchSongs(aiResponse.suggestions)
    
    // Filter to only matched songs
    const matchedSongs = matchingResult.matches
      .filter(match => match.appleMusicSong)
      .map(match => match.appleMusicSong!)
    
    if (matchedSongs.length < 5) {
      return NextResponse.json(
        { 
          error: 'Not enough songs found for this theme. Please try a different theme or add more context.',
          details: {
            suggestionsCount: aiResponse.suggestions.length,
            matchedCount: matchedSongs.length
          }
        },
        { status: 400 }
      )
    }

    // Step 3: Generate questions
    const questionCount = Math.min(matchedSongs.length, 10)
    const questions = generateQuestionSet(
      matchedSongs.slice(0, questionCount),
      matchedSongs, // Use matched songs as the candidate pool
      {
        difficulty: difficulty as 'easy' | 'medium' | 'hard',
        numberOfDetractors: 3,
        gameType: gameType as GameType
      }
    )

    // Step 4: Format questions
    const formattedQuestions = questions.map(q => {
      const correctSong = matchedSongs.find(s => s.id === q.correctSongId)!
      const detractorSongs = q.detractorIds
        .map(id => matchedSongs.find(s => s.id === id)!)
        .filter(Boolean)
      
      return {
        correctSong: {
          id: correctSong.id,
          name: correctSong.attributes.name,
          artist: correctSong.attributes.artistName,
          album: correctSong.attributes.albumName,
          artwork: correctSong.attributes.artwork.url.replace('{w}', '300').replace('{h}', '300'),
          previewUrl: correctSong.attributes.previews?.[0]?.url || null,
          year: new Date(correctSong.attributes.releaseDate).getFullYear().toString(),
          genre: correctSong.attributes.genreNames[0] || 'Unknown'
        },
        detractors: detractorSongs.map(song => ({
          id: song.id,
          name: song.attributes.name,
          artist: song.attributes.artistName,
          album: song.attributes.albumName,
          artwork: song.attributes.artwork.url.replace('{w}', '300').replace('{h}', '300')
        })),
        difficulty,
        gameType
      }
    })

    // Step 5: Optionally save to database
    let questionSetId: string | null = null
    if (saveToDatabase && questionSetName) {
      // Create question set
      const { data: questionSet, error: setError } = await supabase
        .from('question_sets')
        .insert({
          user_id: user.id,
          name: questionSetName,
          description: `AI-generated from theme: ${theme}`,
          difficulty,
          game_type: gameType,
          state: 'DRAFT',
          is_public: false,
          metadata: {
            aiGenerated: true,
            theme: aiResponse.theme,
            interpretation: aiResponse.interpretation,
            matchRate: matchingResult.successRate
          }
        })
        .select()
        .single()

      if (setError) {
        console.error('Failed to create question set:', setError)
        throw new Error('Failed to save question set')
      }

      questionSetId = questionSet.id

      // Create questions
      const questionsToInsert = formattedQuestions.map((q, index) => ({
        question_set_id: questionSetId,
        question: gameType === GAME_TYPES.GUESS_SONG 
          ? `Who is the artist of "${q.correctSong.name}"?`
          : `Name the song by ${q.correctSong.artist}`,
        correct_answer: gameType === GAME_TYPES.GUESS_SONG 
          ? q.correctSong.artist
          : q.correctSong.name,
        wrong_answers: q.detractors.map(d => 
          gameType === GAME_TYPES.GUESS_SONG ? d.artist : d.name
        ),
        type: 'multiple_choice',
        order_index: index,
        metadata: {
          songId: q.correctSong.id,
          songName: q.correctSong.name,
          artist: q.correctSong.artist,
          artwork: q.correctSong.artwork,
          previewUrl: q.correctSong.previewUrl,
          year: q.correctSong.year,
          genre: q.correctSong.genre
        }
      }))

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert)

      if (questionsError) {
        console.error('Failed to create questions:', questionsError)
        // Clean up question set if questions failed
        await supabase.from('question_sets').delete().eq('id', questionSetId)
        throw new Error('Failed to save questions')
      }
    }

    // Return response
    return NextResponse.json({
      theme: aiResponse.theme,
      interpretation: aiResponse.interpretation,
      questions: formattedQuestions,
      totalQuestions: formattedQuestions.length,
      gameType,
      questionSetId,
      summary: {
        aiSuggestions: aiResponse.suggestions.length,
        matchedSongs: matchedSongs.length,
        matchRate: matchingResult.successRate,
        questionsGenerated: formattedQuestions.length
      }
    })
  } catch (error) {
    console.error('[ThemeQuestionGen] Error:', error)
    const appError = errorHandler.handle(error)
    return NextResponse.json(
      { error: errorHandler.getErrorMessage(appError) },
      { status: appError.statusCode }
    )
  }
}