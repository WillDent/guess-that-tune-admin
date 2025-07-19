// ABOUTME: TypeScript types for Apple Music API responses
// ABOUTME: Defines interfaces for songs, albums, artists, and API responses

export interface AppleMusicSong {
  id: string
  type: 'songs'
  href: string
  attributes: {
    albumName: string
    artistName: string
    artwork: {
      width: number
      height: number
      url: string
      bgColor: string
      textColor1: string
      textColor2: string
      textColor3: string
      textColor4: string
    }
    composerName?: string
    contentRating?: string
    discNumber: number
    durationInMillis: number
    genreNames: string[]
    hasLyrics: boolean
    isrc: string
    name: string
    playParams?: {
      id: string
      kind: string
    }
    previews: Array<{
      url: string
    }>
    releaseDate: string
    trackNumber: number
    url: string
  }
  relationships?: {
    artists: {
      data: AppleMusicArtist[]
    }
    albums: {
      data: AppleMusicAlbum[]
    }
  }
}

export interface AppleMusicArtist {
  id: string
  type: 'artists'
  href: string
  attributes: {
    name: string
    genreNames: string[]
    url: string
  }
}

export interface AppleMusicAlbum {
  id: string
  type: 'albums'
  href: string
  attributes: {
    albumName: string
    artistName: string
    artwork: {
      width: number
      height: number
      url: string
    }
    genreNames: string[]
    name: string
    releaseDate: string
    trackCount: number
    url: string
  }
}

export interface AppleMusicSearchResponse {
  results: {
    songs?: {
      data: AppleMusicSong[]
      href: string
      next?: string
    }
    artists?: {
      data: AppleMusicArtist[]
      href: string
      next?: string
    }
    albums?: {
      data: AppleMusicAlbum[]
      href: string
      next?: string
    }
    playlists?: {
      data: AppleMusicPlaylist[]
      href: string
      next?: string
    }
  }
}

export interface AppleMusicChart {
  results: {
    songs?: Array<{
      chart: string
      name: string
      orderId: string
      next?: string
      data: AppleMusicSong[]
    }>
    albums?: Array<{
      chart: string
      name: string
      orderId: string
      next?: string
      data: AppleMusicAlbum[]
    }>
  }
}

export interface AppleMusicPlaylist {
  id: string
  type: 'playlists'
  href: string
  attributes: {
    artwork?: {
      width: number
      height: number
      url: string
      bgColor?: string
      textColor1?: string
      textColor2?: string
      textColor3?: string
      textColor4?: string
    }
    curatorName?: string
    description?: {
      standard: string
      short?: string
    }
    isChart: boolean
    lastModifiedDate: string
    name: string
    playParams?: {
      id: string
      kind: string
      globalId?: string
    }
    playlistType: 'user-shared' | 'editorial' | 'external' | 'personal-mix'
    url: string
    trackCount?: number
  }
  relationships?: {
    curator?: {
      data: Array<{
        id: string
        type: string
        href: string
      }>
    }
    tracks?: {
      data: AppleMusicSong[]
      href: string
      next?: string
    }
  }
}

export interface AppleMusicSearchSuggestion {
  kind: 'terms' | 'topResults'
  searchTerm: string
  displayTerm: string
}

export interface AppleMusicCountry {
  code: string
  name: string
  defaultLanguageTag: string
  supportedLanguageTags: string[]
}

export interface SearchParams {
  term: string
  types?: 'songs' | 'artists' | 'albums' | 'playlists'
  limit?: number
  offset?: number
}

export interface ChartParams {
  storefront?: string
  types?: 'songs' | 'albums' | 'playlists'
  genre?: string
  limit?: number
}

// Helper type for question generation
export interface QuestionSet {
  correctSong: AppleMusicSong
  detractors: AppleMusicSong[]
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
}