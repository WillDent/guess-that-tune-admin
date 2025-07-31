// Song matching service for finding Apple Music tracks from text descriptions
// Uses multiple strategies to match songs with high accuracy

import { appleMusicClient } from './client'
import type { AppleMusicSong } from './types'
import type { OpenAISongSuggestion } from '../openai/theme-service'

export interface SongMatch {
  suggestion: OpenAISongSuggestion
  appleMusicSong?: AppleMusicSong
  matchConfidence: number
  matchStrategy: 'exact' | 'fuzzy' | 'partial' | 'artist_only' | 'not_found'
}

export interface MatchingResult {
  matches: SongMatch[]
  successRate: number
  totalSuggestions: number
  matchedCount: number
}

class SongMatcherService {
  // Match a single song suggestion against Apple Music
  async matchSong(suggestion: OpenAISongSuggestion): Promise<SongMatch> {
    // Try multiple matching strategies in order of preference
    const strategies = [
      () => this.exactMatch(suggestion),
      () => this.fuzzyMatch(suggestion),
      () => this.partialMatch(suggestion),
      () => this.artistOnlyMatch(suggestion)
    ]

    for (const strategy of strategies) {
      try {
        const result = await strategy()
        if (result) {
          return result
        }
      } catch (error) {
        console.error('[SongMatcher] Strategy failed:', error)
        continue
      }
    }

    // No match found
    return {
      suggestion,
      matchConfidence: 0,
      matchStrategy: 'not_found'
    }
  }

  // Match multiple songs in parallel
  async matchSongs(suggestions: OpenAISongSuggestion[]): Promise<MatchingResult> {
    console.log(`[SongMatcher] Matching ${suggestions.length} songs...`)
    
    const matches = await Promise.all(
      suggestions.map(suggestion => this.matchSong(suggestion))
    )

    const matchedCount = matches.filter(m => m.appleMusicSong).length
    const successRate = matchedCount / suggestions.length

    console.log(`[SongMatcher] Matched ${matchedCount}/${suggestions.length} songs (${(successRate * 100).toFixed(1)}%)`)

    return {
      matches,
      successRate,
      totalSuggestions: suggestions.length,
      matchedCount
    }
  }

  // Strategy 1: Exact match with title and artist
  private async exactMatch(suggestion: OpenAISongSuggestion): Promise<SongMatch | null> {
    const searchTerm = `${suggestion.title} ${suggestion.artist}`
    
    const results = await appleMusicClient.search({
      term: searchTerm,
      types: 'songs',
      limit: 10
    })

    const songs = results.results.songs?.data || []
    
    // Look for exact title and artist match
    const exactMatch = songs.find(song => 
      this.normalizeString(song.attributes.name) === this.normalizeString(suggestion.title) &&
      this.normalizeString(song.attributes.artistName) === this.normalizeString(suggestion.artist)
    )

    if (exactMatch) {
      return {
        suggestion,
        appleMusicSong: exactMatch,
        matchConfidence: 1.0,
        matchStrategy: 'exact'
      }
    }

    return null
  }

  // Strategy 2: Fuzzy match allowing for slight variations
  private async fuzzyMatch(suggestion: OpenAISongSuggestion): Promise<SongMatch | null> {
    const searchTerm = `${suggestion.title} ${suggestion.artist}`
    
    const results = await appleMusicClient.search({
      term: searchTerm,
      types: 'songs',
      limit: 10
    })

    const songs = results.results.songs?.data || []
    
    // Calculate similarity scores
    const scoredSongs = songs.map(song => ({
      song,
      score: this.calculateSimilarity(suggestion, song)
    }))

    // Sort by score and take the best match if it's good enough
    const bestMatch = scoredSongs.sort((a, b) => b.score - a.score)[0]
    
    if (bestMatch && bestMatch.score >= 0.8) {
      return {
        suggestion,
        appleMusicSong: bestMatch.song,
        matchConfidence: bestMatch.score,
        matchStrategy: 'fuzzy'
      }
    }

    return null
  }

  // Strategy 3: Partial match (title only or artist only)
  private async partialMatch(suggestion: OpenAISongSuggestion): Promise<SongMatch | null> {
    // Try searching by title only
    const titleResults = await appleMusicClient.search({
      term: suggestion.title,
      types: 'songs',
      limit: 15
    })

    const songs = titleResults.results.songs?.data || []
    
    // Look for songs with matching title and similar artist
    const partialMatch = songs.find(song => {
      const titleMatch = this.normalizeString(song.attributes.name) === this.normalizeString(suggestion.title)
      const artistSimilar = this.stringSimilarity(
        this.normalizeString(song.attributes.artistName),
        this.normalizeString(suggestion.artist)
      ) > 0.7
      
      return titleMatch && artistSimilar
    })

    if (partialMatch) {
      return {
        suggestion,
        appleMusicSong: partialMatch,
        matchConfidence: 0.7,
        matchStrategy: 'partial'
      }
    }

    return null
  }

  // Strategy 4: Artist-only match (find any song by the artist)
  private async artistOnlyMatch(suggestion: OpenAISongSuggestion): Promise<SongMatch | null> {
    const results = await appleMusicClient.search({
      term: suggestion.artist,
      types: 'songs',
      limit: 25
    })

    const songs = results.results.songs?.data || []
    
    // Filter to songs by the exact artist
    const artistSongs = songs.filter(song =>
      this.normalizeString(song.attributes.artistName) === this.normalizeString(suggestion.artist)
    )

    if (artistSongs.length > 0) {
      // Try to find the specific song
      const specificSong = artistSongs.find(song =>
        this.stringSimilarity(
          this.normalizeString(song.attributes.name),
          this.normalizeString(suggestion.title)
        ) > 0.6
      )

      if (specificSong) {
        return {
          suggestion,
          appleMusicSong: specificSong,
          matchConfidence: 0.5,
          matchStrategy: 'artist_only'
        }
      }
    }

    return null
  }

  // Calculate overall similarity between suggestion and Apple Music song
  private calculateSimilarity(suggestion: OpenAISongSuggestion, song: AppleMusicSong): number {
    const titleSimilarity = this.stringSimilarity(
      this.normalizeString(suggestion.title),
      this.normalizeString(song.attributes.name)
    )
    
    const artistSimilarity = this.stringSimilarity(
      this.normalizeString(suggestion.artist),
      this.normalizeString(song.attributes.artistName)
    )

    // Weight title and artist equally
    return (titleSimilarity + artistSimilarity) / 2
  }

  // Normalize strings for comparison
  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ')     // Normalize whitespace
      .trim()
  }

  // Calculate string similarity using Levenshtein distance
  private stringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) {
      return 1.0
    }
    
    const editDistance = this.levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  // Levenshtein distance implementation
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }
}

export const songMatcher = new SongMatcherService()