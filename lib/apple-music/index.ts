// ABOUTME: Main export file for Apple Music API integration
// ABOUTME: Re-exports all public APIs and types for easy importing

export { appleMusicClient } from './client'
export { GENRES, CHART_TYPES } from './config'
export type { 
  AppleMusicSong,
  AppleMusicArtist,
  AppleMusicAlbum,
  AppleMusicSearchResponse,
  AppleMusicChart,
  SearchParams,
  ChartParams,
  QuestionSet
} from './types'

// Export search strategies
export {
  getAllStrategies,
  getStrategiesByType,
  executeRandomStrategy,
  executeMixedStrategies,
  multiTermSearch,
  getTimeSpanSongs,
  getPopularitySongs,
  decadeStrategies,
  moodStrategies,
  regionalStrategies,
  specialStrategies,
  crossGenreStrategies
} from './search-strategies'
export type { SearchStrategy } from './search-strategies'