# Apple Music Advanced Search Feature Plan

## Current Implementation Analysis

### What We Have Now:
1. **Basic Search** - Search by term only (song title, artist, album)
2. **Charts** - Top songs by genre and country
3. **Playlists** - Curated playlists (mood, activity, editorial)
4. **Related Songs** - Find similar songs based on artist/genre

### Limitations:
1. No year/decade filtering in search
2. No mood/theme-based song search
3. No combining multiple filters (e.g., "love songs from 1980s R&B")
4. Limited access to editorial metadata

## Apple Music API Capabilities

Based on the API documentation, here's what's possible:

### 1. Advanced Search Parameters
The Apple Music API supports these search refinements:
- **with** parameter: Filter by specific attributes
- **l** parameter: Localization/storefront
- **types** parameter: songs, albums, artists, playlists
- **limit/offset**: Pagination

### 2. Catalog Attributes We Can Use
- `releaseDate`: Filter by year/decade
- `genreNames`: Filter by genre
- `composerName`: Classical music filtering
- `contentRating`: Clean/explicit filtering
- `trackCount`: Album length filtering

### 3. Editorial Playlists
Apple Music has extensive editorial playlists that we can leverage:
- Theme-based: "Love Songs", "Breakup Songs", "Wedding Songs"
- Era-based: "80s Hits", "90s R&B", "2000s Pop"
- Mood-based: "Happy", "Sad", "Energetic", "Chill"
- Activity-based: "Workout", "Study", "Party", "Sleep"

## Proposed Feature: Advanced Music Discovery

### Core Features:

#### 1. Smart Search Builder
```typescript
interface AdvancedSearchParams {
  theme?: 'love' | 'breakup' | 'party' | 'chill' | 'motivational' | 'sad' | 'happy'
  year?: number
  yearRange?: { start: number, end: number }
  decade?: '1960s' | '1970s' | '1980s' | '1990s' | '2000s' | '2010s' | '2020s'
  genre?: string
  mood?: string
  tempo?: 'slow' | 'medium' | 'fast'
  explicit?: boolean
}
```

#### 2. Implementation Strategy

**Phase 1: Enhanced Playlist Discovery**
- Search for curated playlists by theme + era
- Example: "love songs 80s" → Find Apple Music playlists
- Extract songs from these playlists
- Filter by additional criteria

**Phase 2: Smart Query Building**
- Combine search terms intelligently
- Example: theme="love", decade="1980s", genre="R&B"
- Query: "love songs 1980s R&B"
- Post-filter results by release date

**Phase 3: Hybrid Approach**
- Search both songs directly AND playlists
- Aggregate and deduplicate results
- Rank by relevance (playlist inclusion = higher relevance)

### API Endpoints to Create:

#### 1. `/api/music/discover`
```typescript
// Advanced discovery endpoint
interface DiscoverRequest {
  theme?: string
  year?: number
  yearRange?: { start: number, end: number }
  genre?: string
  mood?: string
  limit?: number
}

interface DiscoverResponse {
  songs: Song[]
  sources: {
    playlists: string[]
    charts: string[]
    search: boolean
  }
  totalResults: number
}
```

#### 2. `/api/music/themes`
```typescript
// Get available themes and moods
interface ThemesResponse {
  themes: Array<{
    id: string
    name: string
    description: string
    sampleQueries: string[]
  }>
  moods: string[]
  activities: string[]
}
```

### Implementation Code Structure:

```typescript
// lib/apple-music/discovery.ts
export class MusicDiscoveryService {
  async discoverSongs(params: AdvancedSearchParams): Promise<Song[]> {
    const strategies = [
      this.searchByPlaylist(params),
      this.searchByDirectQuery(params),
      this.searchByCharts(params)
    ]
    
    const results = await Promise.all(strategies)
    return this.mergeAndRankResults(results)
  }

  private async searchByPlaylist(params: AdvancedSearchParams) {
    // Build playlist search query
    const playlistQuery = this.buildPlaylistQuery(params)
    
    // Search for relevant playlists
    const playlists = await appleMusicClient.search({
      term: playlistQuery,
      types: 'playlists',
      limit: 10
    })
    
    // Get tracks from top playlists
    const tracks = await this.getTracksFromPlaylists(playlists)
    
    // Filter by year if specified
    return this.filterByYear(tracks, params)
  }

  private buildPlaylistQuery(params: AdvancedSearchParams): string {
    const parts = []
    
    if (params.theme) {
      parts.push(params.theme)
    }
    
    if (params.decade) {
      parts.push(params.decade)
    } else if (params.year) {
      parts.push(params.year.toString())
    }
    
    if (params.genre) {
      parts.push(params.genre)
    }
    
    if (params.mood) {
      parts.push(params.mood)
    }
    
    // Add Apple Music specific terms for better results
    parts.push('playlist', 'apple music')
    
    return parts.join(' ')
  }
}
```

### UI Components:

#### 1. Advanced Search Modal
```tsx
<AdvancedSearchModal>
  <ThemeSelector />
  <YearRangePicker />
  <GenreSelector />
  <MoodSelector />
  <SearchResults />
</AdvancedSearchModal>
```

#### 2. Quick Discovery Cards
```tsx
<QuickDiscoveryGrid>
  <DiscoveryCard 
    title="80s Love Songs"
    query={{ theme: 'love', decade: '1980s' }}
  />
  <DiscoveryCard 
    title="90s Hip Hop Party"
    query={{ theme: 'party', decade: '1990s', genre: 'Hip-Hop' }}
  />
  <!-- More preset discoveries -->
</QuickDiscoveryGrid>
```

## Challenges & Solutions

### Challenge 1: Apple Music API Limitations
- **Issue**: No direct filtering by year in search
- **Solution**: Post-filter results by parsing releaseDate

### Challenge 2: Theme/Mood Recognition
- **Issue**: No mood metadata in song attributes
- **Solution**: Leverage editorial playlists that are already categorized

### Challenge 3: Result Quality
- **Issue**: Generic searches return too many irrelevant results
- **Solution**: Multi-strategy approach with ranking algorithm

## Implementation Timeline

### Week 1:
- Create discovery service class
- Implement playlist-based search
- Add year filtering logic

### Week 2:
- Build advanced search UI
- Create theme/mood selectors
- Implement result merging

### Week 3:
- Add preset discovery cards
- Optimize search algorithms
- Add caching layer

### Week 4:
- Testing and refinement
- Performance optimization
- Documentation

## Example Use Cases:

1. **Wedding Playlist**: 
   - Theme: "love", Mood: "romantic", Explicit: false
   - Finds: "Perfect" by Ed Sheeran, "All of Me" by John Legend

2. **80s Workout**:
   - Decade: "1980s", Theme: "motivational", Tempo: "fast"
   - Finds: "Eye of the Tiger", "Push It", "Walking on Sunshine"

3. **Chill R&B from 2000s**:
   - Genre: "R&B", Decade: "2000s", Mood: "chill"
   - Finds: "So Sick" by Ne-Yo, "We Belong Together" by Mariah Carey

## Future Enhancements:

1. **AI-Powered Recommendations**
   - Use song audio features (tempo, key, energy)
   - ML model to understand theme/mood from lyrics

2. **Collaborative Filtering**
   - Track which songs users select from discovery results
   - Improve recommendations based on user behavior

3. **Spotify Integration**
   - Cross-reference with Spotify's mood/audio features
   - Provide multi-platform discovery

4. **Custom Theme Creation**
   - Let users define their own themes
   - Save and share custom discovery queries