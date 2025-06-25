// ABOUTME: Main Apple Music API client for searching and fetching music data
// ABOUTME: Handles all API requests with proper authentication and error handling

import axios, { AxiosInstance } from 'axios'
import { APPLE_MUSIC_API_BASE, CHART_TYPES, GENRES } from './config'
import { AppleMusicTokenGenerator } from './token-generator'
import type { 
  AppleMusicSearchResponse, 
  AppleMusicChart,
  AppleMusicSong,
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
    const response = await this.client.get('/catalog/us/search', {
      params: {
        term: params.term,
        types: params.types || 'songs',
        limit: params.limit || 25,
        offset: params.offset || 0,
      },
    })
    return response.data
  }

  /**
   * Get top charts (songs, albums, playlists)
   */
  async getTopCharts(params: ChartParams): Promise<AppleMusicChart> {
    const { storefront = 'us', types = 'songs', limit = 100, genre } = params
    
    const url = genre 
      ? `/catalog/${storefront}/charts?types=${types}&genre=${genre}&limit=${limit}`
      : `/catalog/${storefront}/charts?types=${types}&limit=${limit}`
    
    const response = await this.client.get(url)
    return response.data
  }

  /**
   * Get songs by genre
   */
  async getSongsByGenre(genreId: string, limit = 50): Promise<AppleMusicSong[]> {
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
}

// Export singleton instance
export const appleMusicClient = new AppleMusicClient()