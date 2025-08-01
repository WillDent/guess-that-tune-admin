// ABOUTME: Generates question sets with intelligent detractor selection
// ABOUTME: Uses similarity scoring to create appropriate difficulty levels

import type { AppleMusicSong } from '@/lib/apple-music'
import { GameType, GAME_TYPES } from '@/types/game-type'

export interface GeneratedQuestion {
  correctSongId: string
  detractorIds: string[]
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface QuestionSetOptions {
  difficulty: 'easy' | 'medium' | 'hard'
  numberOfDetractors: number // Usually 3
  gameType?: GameType // Defaults to 'guess_artist'
}

// Calculate similarity score between two songs (0-100)
function calculateSimilarity(song1: AppleMusicSong, song2: AppleMusicSong, gameType: GameType = GAME_TYPES.GUESS_ARTIST): number {
  let score = 0
  
  if (gameType === GAME_TYPES.GUESS_ARTIST) {
    // Same artist = very similar (should not be used as detractor)
    if (song1.attributes.artistName === song2.attributes.artistName) {
      score += 40
    }
  } else if (gameType === GAME_TYPES.GUESS_SONG) {
    // For guess song mode, avoid songs with similar titles
    const title1 = song1.attributes.name.toLowerCase()
    const title2 = song2.attributes.name.toLowerCase()
    
    // Check for exact match
    if (title1 === title2) {
      score += 50
    }
    // Check for partial matches (e.g., "Love Song" vs "Love Song (Remix)")
    else if (title1.includes(title2) || title2.includes(title1)) {
      score += 30
    }
    // Check for similar words
    else {
      const words1 = title1.split(/\s+/)
      const words2 = title2.split(/\s+/)
      const commonWords = words1.filter(w => words2.includes(w) && w.length > 3)
      if (commonWords.length > 0) {
        score += Math.min(commonWords.length * 10, 20)
      }
    }
  }
  
  // Same genre = similar
  const genre1 = song1.attributes.genreNames[0]
  const genre2 = song2.attributes.genreNames[0]
  if (genre1 && genre2 && genre1 === genre2) {
    score += 30
  }
  
  // Similar release year = somewhat similar
  const year1 = new Date(song1.attributes.releaseDate).getFullYear()
  const year2 = new Date(song2.attributes.releaseDate).getFullYear()
  const yearDiff = Math.abs(year1 - year2)
  if (yearDiff <= 2) {
    score += 20
  } else if (yearDiff <= 5) {
    score += 10
  } else if (yearDiff <= 10) {
    score += 5
  }
  
  // Similar tempo/duration
  const duration1 = song1.attributes.durationInMillis
  const duration2 = song2.attributes.durationInMillis
  const durationDiff = Math.abs(duration1 - duration2) / 1000 // seconds
  if (durationDiff <= 30) {
    score += 10
  }
  
  return Math.min(score, 100)
}

// Select appropriate detractors based on difficulty
export function selectDetractors(
  correctSong: AppleMusicSong,
  allSongs: AppleMusicSong[],
  options: QuestionSetOptions
): AppleMusicSong[] {
  const gameType = options.gameType || GAME_TYPES.GUESS_ARTIST
  
  // Filter out the correct song
  const candidates = allSongs.filter(s => s.id !== correctSong.id)
  
  // Calculate similarity scores
  const scoredCandidates = candidates.map(song => ({
    song,
    similarity: calculateSimilarity(correctSong, song, gameType)
  }))
  
  // Sort by similarity
  scoredCandidates.sort((a, b) => b.similarity - a.similarity)
  
  // Select based on difficulty
  let selectedDetractors: AppleMusicSong[] = []
  
  switch (options.difficulty) {
    case 'easy':
      // Easy: Very different songs (low similarity)
      selectedDetractors = scoredCandidates
        .filter(c => c.similarity < 30)
        .slice(0, options.numberOfDetractors)
        .map(c => c.song)
      break
      
    case 'medium':
      // Medium: Somewhat similar songs
      selectedDetractors = scoredCandidates
        .filter(c => c.similarity >= 30 && c.similarity < 70)
        .slice(0, options.numberOfDetractors)
        .map(c => c.song)
      break
      
    case 'hard':
      // Hard: Very similar songs (high similarity)
      selectedDetractors = scoredCandidates
        .filter(c => c.similarity >= 70)
        .slice(0, options.numberOfDetractors)
        .map(c => c.song)
      break
  }
  
  // If we don't have enough detractors at the desired difficulty,
  // fall back to the closest available songs
  if (selectedDetractors.length < options.numberOfDetractors) {
    const remaining = options.numberOfDetractors - selectedDetractors.length
    const usedIds = new Set(selectedDetractors.map(s => s.id))
    
    const additionalDetractors = scoredCandidates
      .filter(c => !usedIds.has(c.song.id))
      .slice(0, remaining)
      .map(c => c.song)
    
    selectedDetractors = [...selectedDetractors, ...additionalDetractors]
  }
  
  // Shuffle the detractors
  return selectedDetractors.sort(() => Math.random() - 0.5)
}

// Generate a complete question set from selected songs
export function generateQuestionSet(
  selectedSongs: AppleMusicSong[],
  allAvailableSongs: AppleMusicSong[],
  options: QuestionSetOptions
): GeneratedQuestion[] {
  return selectedSongs.map(correctSong => {
    const detractors = selectDetractors(correctSong, allAvailableSongs, options)
    
    return {
      correctSongId: correctSong.id,
      detractorIds: detractors.map(d => d.id),
      difficulty: options.difficulty
    }
  })
}