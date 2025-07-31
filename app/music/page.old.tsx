// ABOUTME: Apple Music browser page for searching and selecting songs
// ABOUTME: Allows browsing Top 100 charts and searching by genre
'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Play, Plus, Music, AlertCircle, ShoppingCart, Globe, ListMusic, Sparkles, Brain } from 'lucide-react'
import { GENRES } from '@/lib/apple-music'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useToast } from '@/hooks/use-toast'
import { errorHandler } from '@/lib/errors/handler'
import { SongListSkeleton } from '@/components/loading/song-skeleton'
import { AddToCartButton } from '@/components/cart/add-to-cart-button'
import { useCart } from '@/contexts/cart-context'
import { CartSong } from '@/types/cart'
import { SongListItem } from '@/components/music/song-list-item'
import { PlaylistBrowser } from '@/components/music/playlist-browser'
import { SearchSuggestions } from '@/components/music/search-suggestions'
import { DiscoveryModal } from '@/components/music/discovery-modal'
import { ThemeDiscoveryModal } from '@/components/music/theme-discovery-modal'

const genreOptions = [
  { value: GENRES.POP, label: 'Pop' },
  { value: GENRES.ROCK, label: 'Rock' },
  { value: GENRES.HIPHOP, label: 'Hip Hop' },
  { value: GENRES.COUNTRY, label: 'Country' },
  { value: GENRES.ELECTRONIC, label: 'Electronic' },
  { value: GENRES.RNB, label: 'R&B' },
  { value: GENRES.ALTERNATIVE, label: 'Alternative' },
  { value: GENRES.LATIN, label: 'Latin' },
  { value: GENRES.JAZZ, label: 'Jazz' },
  { value: GENRES.CLASSICAL, label: 'Classical' },
]

const countryOptions = [
  { value: 'us', label: 'United States' },
  { value: 'gb', label: 'United Kingdom' },
  { value: 'ca', label: 'Canada' },
  { value: 'au', label: 'Australia' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'it', label: 'Italy' },
  { value: 'es', label: 'Spain' },
  { value: 'jp', label: 'Japan' },
  { value: 'kr', label: 'South Korea' },
  { value: 'br', label: 'Brazil' },
  { value: 'mx', label: 'Mexico' },
  { value: 'in', label: 'India' },
  { value: 'nl', label: 'Netherlands' },
  { value: 'se', label: 'Sweden' },
]

interface Song {
  id: string
  name: string
  artist: string
  album: string
  year: string
  genre: string
  previewUrl: string | null
  artwork: string
  durationMs: number
}

export default function MusicPage() {
  const { toast } = useToast()
  const { cart, addToCart } = useCart()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<string>('')
  const [selectedCountry, setSelectedCountry] = useState<string>('us')
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null)
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false)
  const [isThemeDiscoveryOpen, setIsThemeDiscoveryOpen] = useState(false)

  // Fetch Top 100 on mount
  useEffect(() => {
    fetchTopCharts()
  }, [])

  // Fetch by genre when genre changes
  useEffect(() => {
    if (selectedGenre) {
      fetchTopCharts(selectedGenre)
    }
  }, [selectedGenre])

  // Debounced search
  useEffect(() => {
    if (searchDebounce) clearTimeout(searchDebounce)
    
    if (searchTerm) {
      const timeout = setTimeout(() => {
        searchSongs(searchTerm)
      }, 500)
      setSearchDebounce(timeout)
    } else {
      setSongs([])
    }
    
    return () => {
      if (searchDebounce) clearTimeout(searchDebounce)
    }
  }, [searchTerm])

  const fetchTopCharts = async (genre?: string, country?: string) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (genre) params.set('genre', genre)
      if (country) params.set('storefront', country)
      
      const response = await fetch(`/api/music/charts?${params}`)
      const data = await response.json()
      
      if (!response.ok) throw new Error(data.error || 'Failed to fetch charts')
      
      setSongs(data.songs)
    } catch (err) {
      const appError = errorHandler.handle(err)
      toast.error(errorHandler.getErrorMessage(appError))
      setError(err instanceof Error ? err.message : 'Failed to load songs')
    } finally {
      setLoading(false)
    }
  }

  const searchSongs = async (term: string) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ term })
      const response = await fetch(`/api/music/search?${params}`)
      const data = await response.json()
      
      if (!response.ok) throw new Error(data.error || 'Failed to search songs')
      
      setSongs(data.songs)
    } catch (err) {
      const appError = errorHandler.handle(err)
      toast.error(errorHandler.getErrorMessage(appError))
      setError(err instanceof Error ? err.message : 'Failed to search songs')
    } finally {
      setLoading(false)
    }
  }

  const mapSongToCartSong = (song: Song): CartSong => ({
    id: song.id,
    name: song.name,
    artist: song.artist,
    album: song.album,
    artwork: song.artwork,
    genre: song.genre,
    year: song.year,
    previewUrl: song.previewUrl || undefined,
    duration: song.durationMs
  })

  const handleAddAllToCart = () => {
    songs.forEach(song => {
      addToCart(mapSongToCartSong(song))
    })
    toast.success(`${songs.length} songs added to your cart`, "Added all songs to cart")
  }

  const handleDiscoverySongs = (discoveredSongs: any[]) => {
    // Convert discovered songs to cart format and add them
    discoveredSongs.forEach(song => {
      addToCart(mapSongToCartSong(song))
    })
    toast.success(`${discoveredSongs.length} songs added to your cart from discovery`)
    setIsDiscoveryOpen(false)
  }

  const handleThemeDiscoverySongs = (discoveredSongs: any[]) => {
    // Convert discovered songs to cart format and add them
    discoveredSongs.forEach(song => {
      addToCart(mapSongToCartSong(song))
    })
    toast.success(`${discoveredSongs.length} songs added to your cart from AI theme discovery`)
    setIsThemeDiscoveryOpen(false)
  }

  return (
    <ProtectedRoute>
      <div>
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Browse Apple Music</h1>
              <p className="mt-2 text-gray-600">Search the catalog and select songs to create question sets</p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setIsDiscoveryOpen(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Discover Songs
              </Button>
              <Button 
                onClick={() => setIsThemeDiscoveryOpen(true)}
                variant="outline"
                className="border-purple-600 text-purple-600 hover:bg-purple-50"
              >
                <Brain className="h-4 w-4 mr-2" />
                AI Theme Search
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="top100" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-fit">
            <TabsTrigger value="top100">Top 100</TabsTrigger>
            <TabsTrigger value="genre">By Genre</TabsTrigger>
            <TabsTrigger value="playlists">
              <ListMusic className="h-4 w-4 mr-2" />
              Playlists
            </TabsTrigger>
            <TabsTrigger value="international">
              <Globe className="h-4 w-4 mr-2" />
              International
            </TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
          </TabsList>

          <TabsContent value="top100" className="space-y-6">
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h2 className="text-lg font-semibold">Top 100 Songs - United States</h2>
                <div className="flex items-center gap-3">
                  {songs.length > 0 && !loading && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleAddAllToCart}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add All ({songs.length})
                    </Button>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <ShoppingCart className="h-4 w-4" />
                    <span>{cart.totalItems} {cart.totalItems === 1 ? 'song' : 'songs'} in cart</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {loading ? (
                  <SongListSkeleton count={10} />
                ) : error ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-500" />
                    <p className="text-red-600">{error}</p>
                  </div>
                ) : songs.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Music className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No songs found</p>
                  </div>
                ) : (
                  songs.map((song) => (
                    <SongListItem 
                      key={song.id} 
                      song={song} 
                      mapSongToCartSong={mapSongToCartSong}
                    />
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="genre" className="space-y-6">
            <Card className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Select Genre</label>
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Choose a genre" />
                  </SelectTrigger>
                  <SelectContent>
                    {genreOptions.map(genre => (
                      <SelectItem key={genre.value} value={genre.value}>
                        {genre.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedGenre ? (
                loading ? (
                  <SongListSkeleton count={10} />
                ) : error ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-500" />
                    <p className="text-red-600">{error}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {songs.map((song) => (
                      <SongListItem 
                        key={song.id} 
                        song={song} 
                        mapSongToCartSong={mapSongToCartSong}
                      />
                    ))}
                  </div>
                )
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Music className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Select a genre to browse songs</p>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="playlists" className="space-y-6">
            <PlaylistBrowser />
          </TabsContent>

          <TabsContent value="international" className="space-y-6">
            <Card className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Select Country</label>
                <Select value={selectedCountry} onValueChange={(value) => {
                  setSelectedCountry(value)
                  fetchTopCharts(undefined, value)
                }}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Choose a country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countryOptions.map(country => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {loading ? (
                <SongListSkeleton count={10} />
              ) : error ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-500" />
                  <p className="text-red-600">{error}</p>
                </div>
              ) : songs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Music className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No songs found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <h3 className="text-lg font-semibold">
                      Top 100 - {countryOptions.find(c => c.value === selectedCountry)?.label}
                    </h3>
                    {songs.length > 0 && !loading && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleAddAllToCart}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add All ({songs.length})
                      </Button>
                    )}
                  </div>
                  {songs.map((song) => (
                    <SongListItem 
                      key={song.id} 
                      song={song} 
                      mapSongToCartSong={mapSongToCartSong}
                    />
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="search" className="space-y-6">
            <Card className="p-6">
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search for songs, artists, or albums..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                  <SearchSuggestions 
                    searchTerm={searchTerm}
                    onSelectSuggestion={setSearchTerm}
                  />
                </div>
              </div>
              
              {searchTerm ? (
                loading ? (
                  <SongListSkeleton count={10} />
                ) : error ? (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-500" />
                    <p className="text-red-600">{error}</p>
                  </div>
                ) : songs.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No songs found for "{searchTerm}"</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {songs.map((song) => (
                      <SongListItem 
                        key={song.id} 
                        song={song} 
                        mapSongToCartSong={mapSongToCartSong}
                      />
                    ))}
                  </div>
                )
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Start typing to search Apple Music</p>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Discovery Modal */}
        <DiscoveryModal 
          isOpen={isDiscoveryOpen}
          onClose={() => setIsDiscoveryOpen(false)}
          onSelectSongs={handleDiscoverySongs}
        />
        
        {/* AI Theme Discovery Modal */}
        <ThemeDiscoveryModal
          isOpen={isThemeDiscoveryOpen}
          onClose={() => setIsThemeDiscoveryOpen(false)}
          onSelectSongs={handleThemeDiscoverySongs}
        />
      </div>
    </ProtectedRoute>
  )
}