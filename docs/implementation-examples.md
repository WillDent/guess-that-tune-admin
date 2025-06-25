# Apple Music Search Strategies - Implementation Examples

## Quick Start

### 1. Using the New Advanced Question Generation API

```typescript
// Generate questions with a random strategy
const response = await fetch('/api/questions/generate-advanced', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    strategy: 'random',
    count: 10,
    difficulty: 'medium',
    numberOfDetractors: 3
  })
})

// Generate questions from mixed categories
const mixedResponse = await fetch('/api/questions/generate-advanced', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    strategy: 'mixed',
    mixStrategies: true,
    count: 15,
    difficulty: 'hard'
  })
})

// Generate questions from a specific time period
const timeSpanResponse = await fetch('/api/questions/generate-advanced', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    strategy: 'timeSpan',
    timeSpan: {
      startYear: 1980,
      endYear: 1989
    },
    count: 10,
    difficulty: 'medium'
  })
})

// Generate questions by popularity
const popularityResponse = await fetch('/api/questions/generate-advanced', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    strategy: 'popularity',
    popularity: 'viral', // 'viral', 'underground', or 'mainstream'
    count: 10,
    difficulty: 'easy'
  })
})

// Use a specific named strategy
const specificResponse = await fetch('/api/questions/generate-advanced', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    strategy: 'specific',
    strategyName: '90s-grunge-alternative',
    count: 10,
    difficulty: 'hard'
  })
})
```

### 2. Getting Available Strategies

```typescript
// List all available strategies
const strategies = await fetch('/api/questions/generate-advanced', {
  method: 'GET'
})

const data = await strategies.json()
console.log(data)
// Returns:
// {
//   strategies: {
//     decade: [...],
//     mood: [...],
//     regional: [...],
//     special: [...],
//     crossGenre: [...]
//   },
//   total: 35,
//   endpoints: {...}
// }
```

### 3. Direct Usage in Components

```typescript
import { 
  executeRandomStrategy, 
  getAllStrategies,
  getTimeSpanSongs 
} from '@/lib/apple-music'

// In a React component
const QuestionGenerator = () => {
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState([])
  
  const generateRandomQuestions = async () => {
    setLoading(true)
    try {
      // Get songs from a random strategy
      const { songs, strategy } = await executeRandomStrategy()
      
      // Generate questions from these songs
      const questions = generateQuestionSet(
        songs.slice(0, 10), // Select 10 songs
        songs, // Use all songs as pool for detractors
        { difficulty: 'medium', numberOfDetractors: 3 }
      )
      
      setQuestions(questions)
      console.log(`Generated questions using ${strategy.category}`)
    } catch (error) {
      console.error('Failed to generate questions:', error)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <button onClick={generateRandomQuestions} disabled={loading}>
      {loading ? 'Generating...' : 'Generate Random Questions'}
    </button>
  )
}
```

### 4. Creating Custom Strategies

```typescript
// Add your own custom strategy
const customStrategy: SearchStrategy = {
  name: 'indie-folk-2020s',
  category: 'Modern Indie Folk',
  description: 'Contemporary indie folk from the 2020s',
  execute: async () => {
    const results = await appleMusicClient.search({
      term: 'indie folk 2020s bon iver phoebe bridgers',
      types: 'songs',
      limit: 100
    })
    return results.results.songs?.data || []
  }
}

// Use the custom strategy
const songs = await customStrategy.execute()
```

### 5. Combining Multiple Search Terms

```typescript
import { multiTermSearch } from '@/lib/apple-music'

// Search for songs across multiple terms
const diverseSongs = await multiTermSearch([
  'summer hits 2023',
  'viral tiktok songs',
  'indie discoveries',
  'nostalgic 2000s'
], 50) // 50 songs per term

// This gives you a diverse pool of up to 200 unique songs
```

### 6. Building Category-Based Game Modes

```typescript
// Create different game modes based on categories
const gameModes = {
  'Time Travel': {
    description: 'Journey through the decades',
    strategies: ['60s-classics', '70s-disco-funk', '80s-new-wave', '90s-grunge-alternative', '2000s-pop-punk', '2010s-edm']
  },
  'Around the World': {
    description: 'Music from different cultures',
    strategies: ['k-pop-hits', 'latin-reggaeton', 'bollywood-hits', 'afrobeats']
  },
  'Mood Ring': {
    description: 'Match the music to your mood',
    strategies: ['workout-pump', 'road-trip', 'summer-vibes', 'rainy-day', 'party-anthems']
  },
  'Award Show': {
    description: 'Award-winning hits',
    strategies: ['grammy-winners', 'one-hit-wonders', 'movie-soundtracks']
  },
  'Remix Master': {
    description: 'Alternative versions and collaborations',
    strategies: ['acoustic-versions', 'remixes', 'duets-collabs', 'cover-versions']
  }
}

// Generate questions for a specific game mode
async function generateGameModeQuestions(modeName: string) {
  const mode = gameModes[modeName]
  const allSongs = []
  
  for (const strategyName of mode.strategies) {
    const strategy = getAllStrategies().find(s => s.name === strategyName)
    if (strategy) {
      const songs = await strategy.execute()
      allSongs.push(...songs)
    }
  }
  
  // Remove duplicates
  const uniqueSongs = Array.from(new Map(allSongs.map(s => [s.id, s])).values())
  
  // Generate questions
  return generateQuestionSet(
    uniqueSongs.slice(0, 20), // 20 questions
    uniqueSongs,
    { difficulty: 'medium', numberOfDetractors: 3 }
  )
}
```

### 7. Progressive Difficulty

```typescript
// Create questions that get progressively harder
async function generateProgressiveQuestions() {
  const { songs } = await executeRandomStrategy()
  
  const easyQuestions = generateQuestionSet(
    songs.slice(0, 5),
    songs,
    { difficulty: 'easy', numberOfDetractors: 3 }
  )
  
  const mediumQuestions = generateQuestionSet(
    songs.slice(5, 10),
    songs,
    { difficulty: 'medium', numberOfDetractors: 3 }
  )
  
  const hardQuestions = generateQuestionSet(
    songs.slice(10, 15),
    songs,
    { difficulty: 'hard', numberOfDetractors: 3 }
  )
  
  return [
    ...easyQuestions.map(q => ({ ...q, round: 1 })),
    ...mediumQuestions.map(q => ({ ...q, round: 2 })),
    ...hardQuestions.map(q => ({ ...q, round: 3 }))
  ]
}
```

### 8. Caching Implementation

```typescript
// Simple in-memory cache for API responses
const searchCache = new Map<string, { data: any, timestamp: number }>()
const CACHE_TTL = 3600000 // 1 hour

async function cachedSearch(strategy: SearchStrategy) {
  const cacheKey = strategy.name
  const cached = searchCache.get(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`Using cached results for ${strategy.name}`)
    return cached.data
  }
  
  console.log(`Fetching fresh results for ${strategy.name}`)
  const songs = await strategy.execute()
  
  searchCache.set(cacheKey, {
    data: songs,
    timestamp: Date.now()
  })
  
  return songs
}
```

## Best Practices

1. **Rate Limiting**: Apple Music API allows 20 requests/second. Implement rate limiting:
```typescript
import pLimit from 'p-limit'
const limit = pLimit(15) // Stay under the limit

const results = await Promise.all(
  strategies.map(strategy => 
    limit(() => strategy.execute())
  )
)
```

2. **Error Handling**: Always handle API failures gracefully:
```typescript
try {
  const songs = await strategy.execute()
} catch (error) {
  console.error(`Strategy ${strategy.name} failed:`, error)
  // Fall back to a default strategy
  const fallback = await appleMusicClient.getTopCharts({ types: 'songs' })
  return fallback.results.songs?.[0]?.data || []
}
```

3. **Diversity Checks**: Ensure variety in your question sets:
```typescript
function checkDiversity(songs: AppleMusicSong[]) {
  const artists = new Set(songs.map(s => s.attributes.artistName))
  const genres = new Set(songs.map(s => s.attributes.genreNames[0]))
  const years = new Set(songs.map(s => 
    new Date(s.attributes.releaseDate).getFullYear()
  ))
  
  return {
    artistDiversity: artists.size / songs.length,
    genreDiversity: genres.size / songs.length,
    yearSpread: Math.max(...Array.from(years)) - Math.min(...Array.from(years))
  }
}
```

4. **Playlist Rotation**: Keep content fresh:
```typescript
// Track used strategies to avoid repetition
const usedStrategies = new Set<string>()

function getNextStrategy() {
  const available = getAllStrategies().filter(
    s => !usedStrategies.has(s.name)
  )
  
  if (available.length === 0) {
    usedStrategies.clear() // Reset when all used
    return getAllStrategies()[0]
  }
  
  const selected = available[Math.floor(Math.random() * available.length)]
  usedStrategies.add(selected.name)
  return selected
}
```