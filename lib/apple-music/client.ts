// ABOUTME: Main Apple Music API client for searching and fetching music data
// ABOUTME: Handles all API requests with proper authentication and error handling

import axios, { AxiosInstance } from 'axios'
import { APPLE_MUSIC_API_BASE, CHART_TYPES, GENRES } from './config'
import { AppleMusicTokenGenerator } from './token-generator'
import type { 
  AppleMusicSearchResponse, 
  AppleMusicChart,
  AppleMusicSong,
  AppleMusicPlaylist,
  AppleMusicSearchSuggestion,
  SearchParams,
  ChartParams 
} from './types'

export class AppleMusicClient {
  private client: AxiosInstance
  private tokenGenerator: AppleMusicTokenGenerator

  constructor() {
    this.tokenGenerator = AppleMusicTokenGenerator.getInstance()
    this.client = axios.create({
      baseURL: APPLE_MUSIC_API_BASE,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Add auth token to every request
    this.client.interceptors.request.use(async (config) => {
      const token = await this.tokenGenerator.getToken()
      config.headers.Authorization = `Bearer ${token}`
      return config
    })
  }

  /**
   * Search for songs, artists, or albums
   */
  async search(params: SearchParams): Promise<AppleMusicSearchResponse> {
    // Log the actual parameters being sent to Apple Music API
    console.log('[AppleMusicClient.search] Request params:', params);
    
    try {
      const response = await this.client.get('/catalog/us/search', {
        params: {
          term: params.term,
          types: params.types || 'songs',
          limit: params.limit || 25,
          offset: params.offset || 0,
        },
      })
      return response.data
    } catch (error: any) {
      // Log detailed error information
      console.error('[AppleMusicClient.search] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
      });
      
      // Log the actual error message from Apple Music
      if (error.response?.data?.errors) {
        console.error('[AppleMusicClient.search] Apple Music API errors:', 
          JSON.stringify(error.response.data.errors, null, 2)
        );
      }
      
      throw error;
    }
  }

  /**
   * Get top charts (songs, albums, playlists)
   */
  async getTopCharts(params: ChartParams): Promise<AppleMusicChart> {
    const { storefront = 'us', types = 'songs', limit = 25, genre } = params
    
    // Log the actual parameters being sent to Apple Music API
    console.log('[AppleMusicClient.getTopCharts] Request params:', params);
    
    const url = genre 
      ? `/catalog/${storefront}/charts?types=${types}&genre=${genre}&limit=${limit}`
      : `/catalog/${storefront}/charts?types=${types}&limit=${limit}`
    
    try {
      const response = await this.client.get(url)
      return response.data
    } catch (error: any) {
      // Log detailed error information
      console.error('[AppleMusicClient.getTopCharts] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
      });
      
      // Log the actual error message from Apple Music
      if (error.response?.data?.errors) {
        console.error('[AppleMusicClient.getTopCharts] Apple Music API errors:', 
          JSON.stringify(error.response.data.errors, null, 2)
        );
      }
      
      throw error;
    }
  }

  /**
   * Get songs by genre
   */
  async getSongsByGenre(genreId: string, limit = 25): Promise<AppleMusicSong[]> {
    const chartData = await this.getTopCharts({
      types: 'songs',
      genre: genreId,
      limit,
    })
    
    return chartData.results.songs?.[0]?.data || []
  }

  /**
   * Get song details by ID
   */
  async getSong(id: string, storefront = 'us'): Promise<AppleMusicSong> {
    const response = await this.client.get(`/catalog/${storefront}/songs/${id}`)
    return response.data.data[0]
  }

  /**
   * Get multiple songs by IDs
   */
  async getSongs(ids: string[], storefront = 'us'): Promise<AppleMusicSong[]> {
    const response = await this.client.get(`/catalog/${storefront}/songs`, {
      params: { ids: ids.join(',') },
    })
    return response.data.data
  }

  /**
   * Search for similar songs (for generating detractors)
   */
  async findSimilarSongs(
    song: AppleMusicSong, 
    limit = 20
  ): Promise<AppleMusicSong[]> {
    // Search by genre and era
    const genre = song.attributes.genreNames[0]
    const year = new Date(song.attributes.releaseDate).getFullYear()
    const decade = Math.floor(year / 10) * 10
    
    const searchTerm = `${genre} ${decade}s`
    const results = await this.search({ 
      term: searchTerm, 
      types: 'songs',
      limit 
    })
    
    // Filter out the original song
    return (results.results.songs?.data || [])
      .filter(s => s.id !== song.id)
  }

  /**
   * Get playlists (for mood/activity browsing)
   */
  async getPlaylists(params: {
    types?: string[]
    limit?: number
    offset?: number
    storefront?: string
  } = {}): Promise<AppleMusicPlaylist[]> {
    const { 
      types = ['mood', 'activity'], 
      limit = 25, 
      offset = 0,
      storefront = 'us' 
    } = params
    
    try {
      // Use charts endpoint to get curated playlists
      const response = await this.client.get(`/catalog/${storefront}/charts`, {
        params: {
          types: 'playlists',
          limit: limit,
          chart: 'most-played'
        }
      })
      
      const playlists = response.data.results.playlists?.[0]?.data || []
      
      // If we got chart playlists, also fetch some editorial playlists
      if (playlists.length < limit) {
        try {
          // Search for specific curated playlist types
          const searchTerms = [
            'apple music essentials',
            'apple music hits', 
            'mood playlist',
            'workout playlist',
            'chill playlist',
            'party playlist',
            'focus playlist',
            'sleep playlist'
          ]
          
          const searchPromises = searchTerms.slice(0, 3).map(term => 
            this.client.get(`/catalog/${storefront}/search`, {
              params: {
                term,
                types: 'playlists',
                limit: 5
              }
            })
          )
          
          const searchResults = await Promise.all(searchPromises)
          const additionalPlaylists: AppleMusicPlaylist[] = []
          
          searchResults.forEach(result => {
            const found = result.data.results.playlists?.data || []
            const editorial = found.filter((p: AppleMusicPlaylist) => 
              p.attributes.playlistType === 'editorial' || 
              p.attributes.curatorName?.toLowerCase().includes('apple')
            )
            additionalPlaylists.push(...editorial)
          })
          
          // Combine and deduplicate
          const allPlaylists = [...playlists, ...additionalPlaylists]
          const uniquePlaylists = Array.from(
            new Map(allPlaylists.map(p => [p.id, p])).values()
          )
          
          return uniquePlaylists.slice(offset, offset + limit)
        } catch (searchError) {
          console.error('[AppleMusicClient.getPlaylists] Search error:', searchError)
          // Fall back to just chart playlists
          return playlists
        }
      }
      
      return playlists
    } catch (error: any) {
      console.error('[AppleMusicClient.getPlaylists] Error:', error.response?.data)
      throw error
    }
  }

  /**
   * Get tracks from a playlist
   */
  async getPlaylistTracks(
    playlistId: string, 
    storefront = 'us',
    limit = 100,
    offset = 0
  ): Promise<AppleMusicSong[]> {
    try {
      const response = await this.client.get(
        `/catalog/${storefront}/playlists/${playlistId}/tracks`,
        {
          params: { limit, offset }
        }
      )
      return response.data.data || []
    } catch (error: any) {
      console.error('[AppleMusicClient.getPlaylistTracks] Error:', error.response?.data)
      throw error
    }
  }

  /**
   * Get search suggestions
   */
  async getSearchSuggestions(
    term: string,
    storefront = 'us'
  ): Promise<AppleMusicSearchSuggestion[]> {
    try {
      const response = await this.client.get(
        `/catalog/${storefront}/search/suggestions`,
        {
          params: { 
            term,
            kinds: 'terms,topResults',
            limit: 10
          }
        }
      )
      return response.data.results?.suggestions || []
    } catch (error: any) {
      console.error('[AppleMusicClient.getSearchSuggestions] Error:', error.response?.data)
      throw error
    }
  }

  /**
   * Get songs related to a given song
   */
  async getRelatedSongs(
    songId: string,
    storefront = 'us',
    limit = 25
  ): Promise<AppleMusicSong[]> {
    try {
      // First get the song details with relationships
      const songResponse = await this.client.get(
        `/catalog/${storefront}/songs/${songId}`,
        {
          params: {
            include: 'artists,genres,station'
          }
        }
      )
      
      const song = songResponse.data.data[0]
      
      // Use the song's attributes to find similar songs
      const artist = song.attributes.artistName
      const genre = song.attributes.genreNames[0]
      
      // Search for songs by same artist or genre
      const searchResults = await this.search({
        term: `${artist} ${genre}`,
        types: 'songs',
        limit
      })
      
      // Filter out the original song and return
      return (searchResults.results.songs?.data || [])
        .filter(s => s.id !== songId)
    } catch (error: any) {
      console.error('[AppleMusicClient.getRelatedSongs] Error:', error.response?.data)
      throw error
    }
  }

  /**
   * Get charts by country/storefront
   */
  async getChartsByCountry(params: {
    storefront: string
    types?: 'songs' | 'albums' | 'playlists'
    genre?: string
    limit?: number
  }): Promise<AppleMusicChart> {
    const { storefront, types = 'songs', genre, limit = 100 } = params
    
    try {
      return await this.getTopCharts({
        storefront,
        types,
        genre,
        limit
      })
    } catch (error: any) {
      console.error('[AppleMusicClient.getChartsByCountry] Error:', error.response?.data)
      throw error
    }
  }
}

// Export singleton instance
export const appleMusicClient = new AppleMusicClient()