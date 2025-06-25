# Apple Music API Search Strategies Guide

## Overview
This guide outlines various search strategies and parameters available in the Apple Music API to create diverse and interesting question sets for the Guess That Tune game.

## Current Implementation Analysis

### What We Have
1. **Basic Search** (`/api/music/search`)
   - Term-based search
   - Pagination support (limit, offset)
   - Returns songs only

2. **Charts** (`/api/music/charts`)
   - Top charts by genre
   - Limited to 100 songs
   - Basic genre filtering using genre IDs

3. **Genre IDs Currently Defined**
   - Rock: '21'
   - Pop: '14'
   - Hip-Hop: '18'
   - Country: '6'
   - Electronic: '7'
   - R&B: '15'
   - Jazz: '11'
   - Classical: '5'
   - Alternative: '20'
   - Latin: '12'

## Available Apple Music API Features

### 1. Extended Search Parameters

#### Search Types
```typescript
types: 'songs' | 'artists' | 'albums' | 'playlists' | 'stations' | 'music-videos'
```

#### Multiple Type Search
You can search multiple types simultaneously:
```
/catalog/us/search?term=rock&types=songs,albums,playlists
```

### 2. Relationship Expansion

Use `include` parameter to get related data in a single request:
```
/catalog/us/artists/{id}?include=albums,songs,playlists
/catalog/us/albums/{id}?include=tracks,artists
```

### 3. Advanced Filtering

#### ISRC Filtering
Filter songs by International Standard Recording Code:
```
/catalog/us/songs?filter[isrc]={isrc}
```

#### Storefront/Regional Variations
Different regions have different catalogs:
- US: 'us'
- UK: 'gb'
- Japan: 'jp'
- Canada: 'ca'
- Australia: 'au'
- Germany: 'de'
- France: 'fr'
- Brazil: 'br'
- Mexico: 'mx'

### 4. Chart Variations

#### Chart Types Available
- Top Songs
- Top Albums
- Top Playlists
- City Charts (top 25 in specific cities)
- Daily Top 100 (by country)

#### Genre-Specific Charts
Combine charts with genre IDs for targeted results:
```
/catalog/us/charts?types=songs&genre=18&limit=50  // Hip-Hop Top 50
```

### 5. Curated Content Access

#### Editorial Playlists
Apple Music has 250+ mood and activity playlists:
- Workout playlists
- Study/Focus playlists
- Party playlists
- Relaxation playlists
- Seasonal playlists
- Decade-specific playlists

#### Artist Essentials
Access curated "essentials" playlists for popular artists

### 6. Time-Based Strategies (Workarounds)

Since the API lacks native date filtering, implement these strategies:

#### Decade-Based Searches
```javascript
// Search for 80s rock
search({ term: "rock 1980s", types: "songs" })

// Search for 90s hip hop
search({ term: "hip hop 1990s", types: "songs" })
```

#### Year-Specific Searches
```javascript
// Songs from specific years
search({ term: "hits 2010", types: "songs" })
search({ term: "best of 2015", types: "songs" })
```

#### Era Keywords
- "classic rock" (60s-80s)
- "new wave" (80s)
- "grunge" (90s)
- "indie rock 2000s"
- "modern pop" (2020s)

## Recommended Search Strategies for Diverse Question Sets

### 1. **Theme-Based Collections**

#### Decade Themes
```javascript
const decadeSearches = [
  { term: "60s hits", category: "1960s Classics" },
  { term: "70s disco", category: "Disco Era" },
  { term: "80s pop", category: "80s Pop" },
  { term: "90s rock", category: "90s Rock" },
  { term: "2000s hits", category: "Millennium Hits" },
  { term: "2010s top", category: "2010s Charts" }
];
```

#### Activity/Mood Themes
```javascript
const moodSearches = [
  { term: "workout motivation", category: "Workout" },
  { term: "summer hits", category: "Summer Vibes" },
  { term: "road trip", category: "Road Trip" },
  { term: "party anthems", category: "Party" },
  { term: "chill vibes", category: "Relaxation" },
  { term: "wedding songs", category: "Wedding" }
];
```

### 2. **Artist Catalog Exploration**

```javascript
async function getArtistDeepCuts(artistId: string) {
  // Get all albums
  const albums = await client.get(`/catalog/us/artists/${artistId}/albums`);
  
  // Get tracks from non-greatest-hits albums
  const deepCuts = [];
  for (const album of albums.data) {
    if (!album.attributes.name.toLowerCase().includes('greatest hits')) {
      const tracks = await client.get(`/catalog/us/albums/${album.id}/tracks`);
      deepCuts.push(...tracks.data);
    }
  }
  return deepCuts;
}
```

### 3. **Cross-Genre Challenges**

```javascript
const crossGenreSearches = [
  { primary: "rock", secondary: "electronic", term: "electronic rock" },
  { primary: "country", secondary: "pop", term: "country pop crossover" },
  { primary: "jazz", secondary: "hip-hop", term: "jazz hip hop fusion" },
  { primary: "classical", secondary: "modern", term: "classical crossover" }
];
```

### 4. **Regional Music Discovery**

```javascript
async function getRegionalHits() {
  const regions = ['us', 'gb', 'jp', 'br', 'fr', 'de', 'mx', 'au'];
  const regionalSongs = [];
  
  for (const region of regions) {
    const charts = await client.get(`/catalog/${region}/charts?types=songs&limit=25`);
    regionalSongs.push({
      region,
      songs: charts.results.songs[0].data,
      category: `Top Hits in ${region.toUpperCase()}`
    });
  }
  return regionalSongs;
}
```

### 5. **Collaborative Playlists**

Search for collaborative or featured artist tracks:
```javascript
const collaborationSearches = [
  { term: "featuring", category: "Collaborations" },
  { term: "duet", category: "Duets" },
  { term: "vs", category: "Versus Tracks" },
  { term: "remix", category: "Remixes" }
];
```

### 6. **Award Winners & Charts**

```javascript
const awardSearches = [
  { term: "grammy winner", category: "Grammy Winners" },
  { term: "billboard hot 100", category: "Billboard Hits" },
  { term: "platinum hits", category: "Platinum Sellers" },
  { term: "chart topper", category: "Chart Toppers" }
];
```

### 7. **Instrumental & Special Categories**

```javascript
const specialCategories = [
  { term: "instrumental", category: "Instrumentals" },
  { term: "acoustic version", category: "Acoustic" },
  { term: "live performance", category: "Live" },
  { term: "soundtrack", category: "Movie Soundtracks" },
  { term: "tv theme", category: "TV Themes" }
];
```

## Implementation Recommendations

### 1. **Enhanced Search Function**

```typescript
interface EnhancedSearchParams extends SearchParams {
  category?: string;
  yearRange?: { start: number; end: number };
  excludeTerms?: string[];
  includeRelationships?: boolean;
}

async function enhancedSearch(params: EnhancedSearchParams) {
  let searchTerm = params.term;
  
  // Add year range to search
  if (params.yearRange) {
    searchTerm += ` ${params.yearRange.start}-${params.yearRange.end}`;
  }
  
  // Exclude certain terms
  if (params.excludeTerms) {
    searchTerm += params.excludeTerms.map(t => ` -${t}`).join('');
  }
  
  const results = await appleMusicClient.search({
    term: searchTerm,
    types: params.types || 'songs',
    limit: params.limit || 50,
    offset: params.offset || 0
  });
  
  return {
    ...results,
    category: params.category || 'General'
  };
}
```

### 2. **Playlist Mining**

```typescript
async function getPlaylistTracks(playlistId: string) {
  const response = await client.get(`/catalog/us/playlists/${playlistId}`);
  const tracks = response.data.relationships.tracks.data;
  return tracks;
}

// Search for curated playlists
async function findCuratedPlaylists(mood: string) {
  const playlists = await appleMusicClient.search({
    term: mood,
    types: 'playlists',
    limit: 10
  });
  
  // Filter for Apple-curated playlists
  return playlists.results.playlists.data.filter(
    p => p.attributes.curatorName === 'Apple Music'
  );
}
```

### 3. **Smart Detractor Selection**

Enhance the existing detractor selection with:

```typescript
interface EnhancedDetractorOptions extends QuestionSetOptions {
  sameGenre?: boolean;
  sameEra?: boolean;
  sameArtist?: boolean;
  similarTempo?: boolean;
}

function selectSmartDetractors(
  correctSong: AppleMusicSong,
  pool: AppleMusicSong[],
  options: EnhancedDetractorOptions
): AppleMusicSong[] {
  let candidates = pool.filter(s => s.id !== correctSong.id);
  
  // Apply filters based on options
  if (options.sameGenre) {
    candidates = candidates.filter(
      s => s.attributes.genreNames[0] === correctSong.attributes.genreNames[0]
    );
  }
  
  if (options.sameEra) {
    const correctYear = new Date(correctSong.attributes.releaseDate).getFullYear();
    const decade = Math.floor(correctYear / 10) * 10;
    candidates = candidates.filter(s => {
      const year = new Date(s.attributes.releaseDate).getFullYear();
      return year >= decade && year < decade + 10;
    });
  }
  
  // Continue with similarity scoring...
}
```

## Caching Strategy

To optimize API usage:

```typescript
interface CachedSearch {
  query: string;
  results: AppleMusicSearchResponse;
  timestamp: number;
  category: string;
}

class SearchCache {
  private cache: Map<string, CachedSearch> = new Map();
  private readonly TTL = 3600000; // 1 hour
  
  get(query: string): AppleMusicSearchResponse | null {
    const cached = this.cache.get(query);
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.results;
    }
    return null;
  }
  
  set(query: string, results: AppleMusicSearchResponse, category: string) {
    this.cache.set(query, {
      query,
      results,
      timestamp: Date.now(),
      category
    });
  }
}
```

## Question Set Categories

Based on these strategies, implement these diverse categories:

1. **Decades Collection** (60s through 2020s)
2. **Genre Masters** (Deep cuts from each genre)
3. **World Tour** (Regional charts from different countries)
4. **Mood Ring** (Activity and mood-based selections)
5. **Collaboration Station** (Features and duets)
6. **Award Winners** (Grammy, Billboard, etc.)
7. **One-Hit Wonders** (Artists with single major hits)
8. **Cover Versions** (Different takes on classic songs)
9. **Movie & TV** (Soundtracks and themes)
10. **Remix Revolution** (Remixes and alternate versions)
11. **Unplugged** (Acoustic and live versions)
12. **Festival Favorites** (Summer festivals, concert hits)
13. **Guilty Pleasures** (Cheesy but beloved songs)
14. **Underground Gems** (Indie and lesser-known tracks)
15. **Chart Battles** (Songs that competed on charts)

## API Limitations to Consider

1. **No Date Range Filtering**: Must use search terms creatively
2. **Rate Limits**: 20 requests per second max
3. **Missing Metadata**: Some songs lack release dates
4. **Regional Restrictions**: Not all content available in all regions
5. **No Tempo/BPM Data**: Cannot filter by musical characteristics
6. **Limited Sorting**: Only undocumented releaseDate sorting on some endpoints

## Next Steps

1. Implement enhanced search functionality
2. Create category-based question generators
3. Build a rotation system to ensure variety
4. Add caching to reduce API calls
5. Create difficulty scaling based on song popularity/obscurity
6. Implement regional variety in question sets
7. Add seasonal/holiday themed categories
8. Create artist-specific challenges
9. Implement "battle" modes (e.g., Beatles vs Stones)
10. Add progressive difficulty within categories