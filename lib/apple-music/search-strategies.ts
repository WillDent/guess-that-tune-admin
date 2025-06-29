// ABOUTME: Advanced search strategies for creating diverse Apple Music question sets
// ABOUTME: Implements various search patterns beyond basic genre and chart searches

import { appleMusicClient } from './client'
import type { AppleMusicSong, SearchParams } from './types'

export interface SearchStrategy {
  name: string
  category: string
  description: string
  execute: () => Promise<AppleMusicSong[]>
}

// Decade-based search strategies
export const decadeStrategies: SearchStrategy[] = [
  {
    name: '60s-classics',
    category: '60s Classics',
    description: 'Classic hits from the 1960s',
    execute: async () => {
      const results = await appleMusicClient.search({
        term: '60s hits classic 1960s',
        types: 'songs',
        limit: 25
      })
      return results.results.songs?.data || []
    }
  },
  {
    name: '70s-disco-funk',
    category: '70s Disco & Funk',
    description: 'Disco and funk hits from the 1970s',
    execute: async () => {
      const results = await appleMusicClient.search({
        term: 'disco funk 1970s bee gees earth wind fire',
        types: 'songs',
        limit: 25
      })
      return results.results.songs?.data || []
    }
  },
  {
    name: '80s-new-wave',
    category: '80s New Wave',
    description: 'New wave and synth-pop from the 1980s',
    execute: async () => {
      const results = await appleMusicClient.search({
        term: 'new wave 80s synth pop depeche mode duran duran',
        types: 'songs',
        limit: 25
      })
      return results.results.songs?.data || []
    }
  },
  {
    name: '90s-grunge-alternative',
    category: '90s Grunge & Alternative',
    description: 'Grunge and alternative rock from the 1990s',
    execute: async () => {
      const results = await appleMusicClient.search({
        term: 'grunge alternative rock 90s nirvana pearl jam',
        types: 'songs',
        limit: 25
      })
      return results.results.songs?.data || []
    }
  },
  {
    name: '2000s-pop-punk',
    category: '2000s Pop Punk',
    description: 'Pop punk and emo from the 2000s',
    execute: async () => {
      const results = await appleMusicClient.search({
        term: 'pop punk emo 2000s blink 182 fall out boy',
        types: 'songs',
        limit: 25
      })
      return results.results.songs?.data || []
    }
  },
  {
    name: '2010s-edm',
    category: '2010s EDM',
    description: 'Electronic dance music from the 2010s',
    execute: async () => {
      const results = await appleMusicClient.search({
        term: 'EDM electronic dance 2010s avicii calvin harris',
        types: 'songs',
        limit: 25
      })
      return results.results.songs?.data || []
    }
  }
]

// Activity and mood-based strategies
export const moodStrategies: SearchStrategy[] = [
  {
    name: 'workout-pump',
    category: 'Workout Pump',
    description: 'High-energy songs for working out',
    execute: async () => {
      const results = await appleMusicClient.search({
        term: 'workout motivation pump gym energy',
        types: 'songs',
        limit: 25
      })
      return results.results.songs?.data || []
    }
  },
  {
    name: 'road-trip',
    category: 'Road Trip Classics',
    description: 'Perfect songs for long drives',
    execute: async () => {
      const results = await appleMusicClient.search({
        term: 'road trip driving highway songs',
        types: 'songs',
        limit: 25
      })
      return results.results.songs?.data || []
    }
  },
  {
    name: 'summer-vibes',
    category: 'Summer Vibes',
    description: 'Feel-good summer hits',
    execute: async () => {
      const results = await appleMusicClient.search({
        term: 'summer beach vacation tropical vibes',
        types: 'songs',
        limit: 25
      })
      return results.results.songs?.data || []
    }
  },
  {
    name: 'rainy-day',
    category: 'Rainy Day Mood',
    description: 'Mellow songs for rainy days',
    execute: async () => {
      const results = await appleMusicClient.search({
        term: 'rainy day mellow chill acoustic indie',
        types: 'songs',
        limit: 25
      })
      return results.results.songs?.data || []
    }
  },
  {
    name: 'party-anthems',
    category: 'Party Anthems',
    description: 'Songs that get the party started',
    execute: async () => {
      const results = await appleMusicClient.search({
        term: 'party anthems dance club hits',
        types: 'songs',
        limit: 25
      })
      return results.results.songs?.data || []
    }
  }
]

// Regional music strategies
export const regionalStrategies: SearchStrategy[] = [
  {
    name: 'k-pop-hits',
    category: 'K-Pop Hits',
    description: 'Popular K-Pop songs',
    execute: async () => {
      const results = await appleMusicClient.search({
        term: 'k-pop korean pop BTS blackpink',
        types: 'songs',
        limit: 25
      })
      return results.results.songs?.data || []
    }
  },
  {
    name: 'latin-reggaeton',
    category: 'Latin & Reggaeton',
    description: 'Latin and reggaeton hits',
    execute: async () => {
      const results = await appleMusicClient.search({
        term: 'reggaeton latin bad bunny daddy yankee',
        types: 'songs',
        limit: 25
      })
      return results.results.songs?.data || []
    }
  },
  {
    name: 'bollywood-hits',
    category: 'Bollywood Hits',
    description: 'Popular Bollywood songs',
    execute: async () => {
      const results = await appleMusicClient.search({
        term: 'bollywood hindi film songs',
        types: 'songs',
        limit: 25
      })
      return results.results.songs?.data || []
    }
  },
  {
    name: 'afrobeats',
    category: 'Afrobeats',
    description: 'African beats and rhythms',
    execute: async () => {
      const results = await appleMusicClient.search({
        term: 'afrobeats african wizkid burna boy',
        types: 'songs',
        limit: 25
      })
      return results.results.songs?.data || []
    }
  }
]

// Special categories
export const specialStrategies: SearchStrategy[] = [
  {
    name: 'one-hit-wonders',
    category: 'One Hit Wonders',
    description: 'Artists known for one big hit',
    execute: async () => {
      const results = await appleMusicClient.search({
        term: 'one hit wonder',
        types: 'songs',
        limit: 25
      })
      return results.results.songs?.data || []
    }
  },
  {
    name: 'movie-soundtracks',
    category: 'Movie Soundtracks',
    description: 'Iconic songs from movies',
    execute: async () => {
      const results = await appleMusicClient.search({
        term: 'movie soundtrack theme oscar winner',
        types: 'songs',
        limit: 25
      })
      return results.results.songs?.data || []
    }
  },
  {
    name: 'tv-themes',
    category: 'TV Theme Songs',
    description: 'Memorable television theme songs',
    execute: async () => {
      const results = await appleMusicClient.search({
        term: 'tv theme song television show',
        types: 'songs',
        limit: 25
      })
      return results.results.songs?.data || []
    }
  },
  {
    name: 'acoustic-versions',
    category: 'Acoustic Versions',
    description: 'Stripped-down acoustic performances',
    execute: async () => {
      const results = await appleMusicClient.search({
        term: 'acoustic version unplugged stripped',
        types: 'songs',
        limit: 25
      })
      return results.results.songs?.data || []
    }
  },
  {
    name: 'remixes',
    category: 'Remixes',
    description: 'Popular remixes and alternate versions',
    execute: async () => {
      const results = await appleMusicClient.search({
        term: 'remix club mix dance version',
        types: 'songs',
        limit: 25
      })
      return results.results.songs?.data || []
    }
  },
  {
    name: 'duets-collabs',
    category: 'Duets & Collaborations',
    description: 'Songs featuring multiple artists',
    execute: async () => {
      const results = await appleMusicClient.search({
        term: 'duet featuring collaboration feat',
        types: 'songs',
        limit: 25
      })
      return results.results.songs?.data || []
    }
  },
  {
    name: 'cover-versions',
    category: 'Cover Versions',
    description: 'Popular cover songs',
    execute: async () => {
      const results = await appleMusicClient.search({
        term: 'cover version tribute',
        types: 'songs',
        limit: 25
      })
      return results.results.songs?.data || []
    }
  },
  {
    name: 'grammy-winners',
    category: 'Grammy Winners',
    description: 'Grammy award-winning songs',
    execute: async () => {
      const results = await appleMusicClient.search({
        term: 'grammy winner award song of the year',
        types: 'songs',
        limit: 25
      })
      return results.results.songs?.data || []
    }
  }
]

// Combined genre strategies (cross-genre)
export const crossGenreStrategies: SearchStrategy[] = [
  {
    name: 'country-pop-crossover',
    category: 'Country Pop Crossover',
    description: 'Country songs with pop appeal',
    execute: async () => {
      const results = await appleMusicClient.search({
        term: 'country pop crossover taylor swift shania',
        types: 'songs',
        limit: 25
      })
      return results.results.songs?.data || []
    }
  },
  {
    name: 'jazz-fusion',
    category: 'Jazz Fusion',
    description: 'Jazz mixed with other genres',
    execute: async () => {
      const results = await appleMusicClient.search({
        term: 'jazz fusion funk soul contemporary',
        types: 'songs',
        limit: 25
      })
      return results.results.songs?.data || []
    }
  },
  {
    name: 'folk-rock',
    category: 'Folk Rock',
    description: 'Folk music with rock elements',
    execute: async () => {
      const results = await appleMusicClient.search({
        term: 'folk rock bob dylan simon garfunkel',
        types: 'songs',
        limit: 25
      })
      return results.results.songs?.data || []
    }
  },
  {
    name: 'rap-rock',
    category: 'Rap Rock',
    description: 'Hip-hop and rock fusion',
    execute: async () => {
      const results = await appleMusicClient.search({
        term: 'rap rock nu metal linkin park',
        types: 'songs',
        limit: 25
      })
      return results.results.songs?.data || []
    }
  }
]

// Get all available strategies
export function getAllStrategies(): SearchStrategy[] {
  return [
    ...decadeStrategies,
    ...moodStrategies,
    ...regionalStrategies,
    ...specialStrategies,
    ...crossGenreStrategies
  ]
}

// Get strategies by category type
export function getStrategiesByType(type: 'decade' | 'mood' | 'regional' | 'special' | 'crossGenre'): SearchStrategy[] {
  switch (type) {
    case 'decade':
      return decadeStrategies
    case 'mood':
      return moodStrategies
    case 'regional':
      return regionalStrategies
    case 'special':
      return specialStrategies
    case 'crossGenre':
      return crossGenreStrategies
    default:
      return []
  }
}

// Execute a random strategy
export async function executeRandomStrategy(): Promise<{ 
  songs: AppleMusicSong[], 
  strategy: SearchStrategy 
}> {
  const strategies = getAllStrategies()
  const randomStrategy = strategies[Math.floor(Math.random() * strategies.length)]
  const songs = await randomStrategy.execute()
  
  return {
    songs,
    strategy: randomStrategy
  }
}

// Execute multiple strategies and combine results
export async function executeMixedStrategies(count: number = 3): Promise<{
  songs: AppleMusicSong[],
  strategies: SearchStrategy[]
}> {
  const allStrategies = getAllStrategies()
  const selectedStrategies: SearchStrategy[] = []
  const allSongs: AppleMusicSong[] = []
  const songIds = new Set<string>()
  
  // Randomly select strategies
  for (let i = 0; i < count && i < allStrategies.length; i++) {
    const randomIndex = Math.floor(Math.random() * allStrategies.length)
    const strategy = allStrategies[randomIndex]
    
    // Avoid duplicates
    if (!selectedStrategies.find(s => s.name === strategy.name)) {
      selectedStrategies.push(strategy)
      
      try {
        const songs = await strategy.execute()
        
        // Add unique songs only
        for (const song of songs) {
          if (!songIds.has(song.id)) {
            songIds.add(song.id)
            allSongs.push(song)
          }
        }
      } catch (error) {
        console.error(`Failed to execute strategy ${strategy.name}:`, error)
      }
    }
  }
  
  // Shuffle the combined results
  const shuffled = allSongs.sort(() => Math.random() - 0.5)
  
  return {
    songs: shuffled,
    strategies: selectedStrategies
  }
}

// Search by multiple terms and combine results
export async function multiTermSearch(terms: string[], limit = 25): Promise<AppleMusicSong[]> {
  const allSongs: AppleMusicSong[] = []
  const songIds = new Set<string>()
  
  for (const term of terms) {
    try {
      const results = await appleMusicClient.search({
        term,
        types: 'songs',
        limit
      })
      
      const songs = results.results.songs?.data || []
      
      // Add unique songs
      for (const song of songs) {
        if (!songIds.has(song.id)) {
          songIds.add(song.id)
          allSongs.push(song)
        }
      }
    } catch (error) {
      console.error(`Failed to search for term "${term}":`, error)
    }
  }
  
  return allSongs
}

// Get songs from different time periods
export async function getTimeSpanSongs(startYear: number, endYear: number): Promise<AppleMusicSong[]> {
  const songs: AppleMusicSong[] = []
  const yearTerms: string[] = []
  
  // Create search terms for each year
  for (let year = startYear; year <= endYear; year++) {
    yearTerms.push(`hits ${year}`)
    yearTerms.push(`best of ${year}`)
  }
  
  // Also add decade terms if span covers multiple decades
  const startDecade = Math.floor(startYear / 10) * 10
  const endDecade = Math.floor(endYear / 10) * 10
  
  for (let decade = startDecade; decade <= endDecade; decade += 10) {
    yearTerms.push(`${decade}s music`)
  }
  
  return multiTermSearch(yearTerms, 25)
}

// Get songs by popularity metrics
export async function getPopularitySongs(type: 'viral' | 'underground' | 'mainstream'): Promise<AppleMusicSong[]> {
  const searchTerms: { [key: string]: string[] } = {
    viral: ['viral hits', 'tiktok songs', 'trending now'],
    underground: ['indie gems', 'underground hits', 'undiscovered'],
    mainstream: ['top 40', 'billboard hot 100', 'chart toppers']
  }
  
  return multiTermSearch(searchTerms[type], 25)
}