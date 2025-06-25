// ABOUTME: Configuration for Apple Music API integration
// ABOUTME: Handles JWT token generation and API endpoints

export const APPLE_MUSIC_API_BASE = 'https://api.music.apple.com/v1'

export const APPLE_MUSIC_CONFIG = {
  teamId: process.env.APPLE_TEAM_ID || '',
  keyId: process.env.APPLE_KEY_ID || '',
  privateKey: process.env.APPLE_PRIVATE_KEY || '',
  
  // Token expires after 6 months max
  tokenExpirationTime: 15777000,
  
  // Default storefront (US)
  defaultStorefront: 'us',
  
  // API rate limits
  maxRequestsPerSecond: 20,
}

export const CHART_TYPES = {
  TOP_SONGS: 'songs',
  TOP_ALBUMS: 'albums',
  TOP_PLAYLISTS: 'playlists',
} as const

export const GENRES = {
  ROCK: '21',
  POP: '14',
  HIPHOP: '18',
  COUNTRY: '6',
  ELECTRONIC: '7',
  RNB: '15',
  JAZZ: '11',
  CLASSICAL: '5',
  ALTERNATIVE: '20',
  LATIN: '12',
} as const