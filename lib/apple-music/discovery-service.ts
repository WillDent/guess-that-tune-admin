// Music Discovery Service for advanced search capabilities
// Enables searching by theme, mood, year, and genre combinations

import { appleMusicClient } from './client'
import type { AppleMusicSong, AppleMusicPlaylist } from './types'

export interface AdvancedSearchParams {
  theme?: 'love' | 'breakup' | 'party' | 'chill' | 'motivational' | 'sad' | 'happy' | 'wedding' | 'workout'
  year?: number
  yearRange?: { start: number; end: number }
  decade?: '1960s' | '1970s' | '1980s' | '1990s' | '2000s' | '2010s' | '2020s'
  genre?: string
  mood?: string
  tempo?: 'slow' | 'medium' | 'fast'
  explicit?: boolean
  limit?: number
}

export interface DiscoveryResult {
  songs: AppleMusicSong[]
  sources: {
    playlists: string[]
    directSearch: boolean
    charts: boolean
  }
  totalResults: number
  searchQuery: string
}

// Theme to search term mappings
const THEME_KEYWORDS: Record<string, string[]> = {
  love: ['love', 'romance', 'romantic', 'valentine', 'crush', 'falling in love'],
  breakup: ['breakup', 'heartbreak', 'goodbye', 'separation', 'moving on'],
  party: ['party', 'dance', 'club', 'celebration', 'friday night'],
  chill: ['chill', 'relax', 'calm', 'mellow', 'laid back', 'easy'],
  motivational: ['motivation', 'workout', 'pump up', 'energy', 'power'],
  sad: ['sad', 'melancholy', 'heartbreak', 'emotional', 'crying'],
  happy: ['happy', 'joy', 'upbeat', 'positive', 'good vibes'],
  wedding: ['wedding', 'marriage', 'first dance', 'bride', 'groom'],
  workout: ['workout', 'gym', 'running', 'cardio', 'training']
}

// Decade to year range mapping
const DECADE_RANGES: Record<string, { start: number; end: number }> = {
  '1960s': { start: 1960, end: 1969 },
  '1970s': { start: 1970, end: 1979 },
  '1980s': { start: 1980, end: 1989 },
  '1990s': { start: 1990, end: 1999 },
  '2000s': { start: 2000, end: 2009 },
  '2010s': { start: 2010, end: 2019 },
  '2020s': { start: 2020, end: 2029 }
}

export class MusicDiscoveryService {
  async discoverSongs(params: AdvancedSearchParams): Promise<DiscoveryResult> {
    const searchQuery = this.buildSearchQuery(params)
    const limit = params.limit || 50
    
    console.log('[MusicDiscovery] Searching with query:', searchQuery)
    console.log('[MusicDiscovery] Parameters:', params)
    
    // Run multiple search strategies in parallel
    const [playlistResults, directResults] = await Promise.all([
      this.searchByPlaylist(params, searchQuery, limit),
      this.searchDirectly(params, searchQuery, limit)
    ])
    
    // Merge and deduplicate results
    const allSongs = this.mergeAndDeduplicate([
      ...playlistResults.songs,
      ...directResults.songs
    ])
    
    // Apply filters
    const filteredSongs = this.applyFilters(allSongs, params)
    
    // Sort by relevance
    const rankedSongs = this.rankResults(filteredSongs, params)
    
    return {
      songs: rankedSongs.slice(0, limit),
      sources: {
        playlists: playlistResults.playlistNames,
        directSearch: directResults.songs.length > 0,
        charts: false // TODO: Implement chart search
      },
      totalResults: rankedSongs.length,
      searchQuery
    }
  }

  private async searchByPlaylist(
    params: AdvancedSearchParams, 
    searchQuery: string,
    limit: number
  ): Promise<{ songs: AppleMusicSong[]; playlistNames: string[] }> {
    try {
      // Search for relevant playlists
      const playlistQuery = `${searchQuery} playlist apple music`
      const searchResults = await appleMusicClient.search({
        term: playlistQuery,
        types: 'playlists',
        limit: 10
      })
      
      const playlists = searchResults.results.playlists?.data || []
      
      // Filter playlists by relevance
      const relevantPlaylists = this.filterRelevantPlaylists(playlists, params)
      
      if (relevantPlaylists.length === 0) {
        return { songs: [], playlistNames: [] }
      }
      
      // Get tracks from top playlists
      const songPromises = relevantPlaylists.slice(0, 3).map(playlist =>
        appleMusicClient.getPlaylistTracks(playlist.id, 'us', 100, 0)
          .catch(err => {
            console.error(`[MusicDiscovery] Failed to get tracks from playlist ${playlist.id}:`, err)
            return []
          })
      )
      
      const songArrays = await Promise.all(songPromises)
      const allSongs = songArrays.flat()
      
      return {
        songs: allSongs,
        playlistNames: relevantPlaylists.map(p => p.attributes.name)
      }
    } catch (error) {
      console.error('[MusicDiscovery] Playlist search error:', error)
      return { songs: [], playlistNames: [] }
    }
  }

  private async searchDirectly(
    params: AdvancedSearchParams,
    searchQuery: string,
    limit: number
  ): Promise<{ songs: AppleMusicSong[] }> {
    try {
      const searchResults = await appleMusicClient.search({
        term: searchQuery,
        types: 'songs',
        limit: limit * 2 // Get extra to account for filtering
      })
      
      return {
        songs: searchResults.results.songs?.data || []
      }
    } catch (error) {
      console.error('[MusicDiscovery] Direct search error:', error)
      return { songs: [] }
    }
  }

  private buildSearchQuery(params: AdvancedSearchParams): string {
    const parts: string[] = []
    
    // Add theme keywords
    if (params.theme) {
      const keywords = THEME_KEYWORDS[params.theme] || [params.theme]
      parts.push(keywords[0]) // Use primary keyword
    }
    
    // Add mood
    if (params.mood) {
      parts.push(params.mood)
    }
    
    // Add genre
    if (params.genre) {
      parts.push(params.genre)
    }
    
    // Add decade or year
    if (params.decade) {
      parts.push(params.decade)
    } else if (params.year) {
      parts.push(params.year.toString())
    } else if (params.yearRange) {
      parts.push(`${params.yearRange.start}s`)
    }
    
    return parts.join(' ')
  }

  private filterRelevantPlaylists(
    playlists: AppleMusicPlaylist[], 
    params: AdvancedSearchParams
  ): AppleMusicPlaylist[] {
    return playlists.filter(playlist => {
      const name = playlist.attributes.name.toLowerCase()
      const description = (playlist.attributes.description?.standard || '').toLowerCase()
      const combined = `${name} ${description}`
      
      // Check if playlist matches theme
      if (params.theme) {
        const keywords = THEME_KEYWORDS[params.theme] || []
        const hasThemeMatch = keywords.some(keyword => 
          combined.includes(keyword.toLowerCase())
        )
        if (!hasThemeMatch) return false
      }
      
      // Check if playlist matches decade/year
      if (params.decade) {
        if (!combined.includes(params.decade.slice(0, -1))) return false
      } else if (params.year) {
        if (!combined.includes(params.year.toString())) return false
      }
      
      // Prefer Apple Music editorial playlists
      const isEditorial = playlist.attributes.curatorName?.toLowerCase().includes('apple') ||
                         playlist.attributes.playlistType === 'editorial'
      
      return isEditorial
    })
  }

  private applyFilters(songs: AppleMusicSong[], params: AdvancedSearchParams): AppleMusicSong[] {
    return songs.filter(song => {
      // Filter by year/decade
      if (params.year || params.yearRange || params.decade) {
        const releaseYear = new Date(song.attributes.releaseDate).getFullYear()
        
        if (params.year && releaseYear !== params.year) {
          return false
        }
        
        if (params.yearRange) {
          if (releaseYear < params.yearRange.start || releaseYear > params.yearRange.end) {
            return false
          }
        }
        
        if (params.decade) {
          const range = DECADE_RANGES[params.decade]
          if (releaseYear < range.start || releaseYear > range.end) {
            return false
          }
        }
      }
      
      // Filter by explicit content
      if (params.explicit !== undefined) {
        const isExplicit = song.attributes.contentRating === 'explicit'
        if (params.explicit !== isExplicit) {
          return false
        }
      }
      
      // Filter by genre
      if (params.genre) {
        const hasGenre = song.attributes.genreNames.some(g => 
          g.toLowerCase().includes(params.genre!.toLowerCase())
        )
        if (!hasGenre) return false
      }
      
      return true
    })
  }

  private mergeAndDeduplicate(songs: AppleMusicSong[]): AppleMusicSong[] {
    const seen = new Set<string>()
    return songs.filter(song => {
      if (seen.has(song.id)) {
        return false
      }
      seen.add(song.id)
      return true
    })
  }

  private rankResults(songs: AppleMusicSong[], params: AdvancedSearchParams): AppleMusicSong[] {
    // Simple relevance scoring
    const scored = songs.map(song => {
      let score = 0
      const name = song.attributes.name.toLowerCase()
      const artist = song.attributes.artistName.toLowerCase()
      
      // Boost score if song name contains theme keywords
      if (params.theme) {
        const keywords = THEME_KEYWORDS[params.theme] || []
        keywords.forEach(keyword => {
          if (name.includes(keyword.toLowerCase())) score += 10
          if (artist.includes(keyword.toLowerCase())) score += 5
        })
      }
      
      // Boost score for exact year match
      if (params.year) {
        const releaseYear = new Date(song.attributes.releaseDate).getFullYear()
        if (releaseYear === params.year) score += 5
      }
      
      // Boost score for genre match
      if (params.genre) {
        const hasExactGenre = song.attributes.genreNames.some(g => 
          g.toLowerCase() === params.genre!.toLowerCase()
        )
        if (hasExactGenre) score += 5
      }
      
      return { song, score }
    })
    
    // Sort by score descending
    scored.sort((a, b) => b.score - a.score)
    
    return scored.map(item => item.song)
  }
}

// Export singleton instance
export const musicDiscoveryService = new MusicDiscoveryService()