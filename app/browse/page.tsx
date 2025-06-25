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
import { Search, Play, Plus, Music, AlertCircle } from 'lucide-react'
import { GENRES } from '@/lib/apple-music'

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

export default function BrowsePage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<string>('')
  const [selectedSongs, setSelectedSongs] = useState<string[]>([])
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null)

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

  const fetchTopCharts = async (genre?: string) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (genre) params.set('genre', genre)
      
      const response = await fetch(`/api/music/charts?${params}`)
      const data = await response.json()
      
      if (!response.ok) throw new Error(data.error || 'Failed to fetch charts')
      
      setSongs(data.songs)
    } catch (err) {
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
      setError(err instanceof Error ? err.message : 'Failed to search songs')
    } finally {
      setLoading(false)
    }
  }

  const toggleSongSelection = (songId: string) => {
    setSelectedSongs(prev => 
      prev.includes(songId) 
        ? prev.filter(id => id !== songId)
        : [...prev, songId]
    )
  }

  const handleCreateQuestionSet = () => {
    // Store selected songs in sessionStorage
    const selectedSongData = songs.filter(song => selectedSongs.includes(song.id))
    sessionStorage.setItem('selectedSongs', JSON.stringify(selectedSongData))
    
    // Navigate to create question set page
    window.location.href = '/questions/new'
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Browse Apple Music</h1>
            <p className="mt-2 text-gray-600">Search the catalog and select songs to create question sets</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="top100" className="space-y-6">
        <TabsList>
          <TabsTrigger value="top100">Top 100</TabsTrigger>
          <TabsTrigger value="genre">By Genre</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
        </TabsList>

        <TabsContent value="top100" className="space-y-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Top 100 Songs - United States</h2>
              <Button 
                disabled={selectedSongs.length === 0}
                onClick={handleCreateQuestionSet}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Question Set ({selectedSongs.length})
              </Button>
            </div>
            <div className="space-y-2">
              {loading ? (
                // Loading skeletons
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4 p-4">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-12 w-12 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-8 w-16" />
                  </div>
                ))
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
                  <div 
                    key={song.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedSongs.includes(song.id)}
                        onChange={() => toggleSongSelection(song.id)}
                        className="h-4 w-4 text-pink-600 rounded border-gray-300"
                      />
                      {song.artwork && (
                        <img 
                          src={song.artwork} 
                          alt={`${song.album} artwork`}
                          className="w-12 h-12 rounded object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{song.name}</p>
                        <p className="text-sm text-gray-600">{song.artist} • {song.album}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant="secondary">{song.genre}</Badge>
                      <span className="text-sm text-gray-500">{song.year}</span>
                      {song.previewUrl && (
                        <Button size="sm" variant="ghost">
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
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
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-12 w-12 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-8 w-16" />
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-500" />
                  <p className="text-red-600">{error}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {songs.map((song) => (
                    <div 
                      key={song.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <input
                          type="checkbox"
                          checked={selectedSongs.includes(song.id)}
                          onChange={() => toggleSongSelection(song.id)}
                          className="h-4 w-4 text-pink-600 rounded border-gray-300"
                        />
                        {song.artwork && (
                          <img 
                            src={song.artwork} 
                            alt={`${song.album} artwork`}
                            className="w-12 h-12 rounded object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{song.name}</p>
                          <p className="text-sm text-gray-600">{song.artist} • {song.album}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm text-gray-500">{song.year}</span>
                        {song.previewUrl && (
                          <Button size="sm" variant="ghost">
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
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
              </div>
            </div>
            
            {searchTerm ? (
              loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-12 w-12 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-8 w-16" />
                    </div>
                  ))}
                </div>
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
                    <div 
                      key={song.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <input
                          type="checkbox"
                          checked={selectedSongs.includes(song.id)}
                          onChange={() => toggleSongSelection(song.id)}
                          className="h-4 w-4 text-pink-600 rounded border-gray-300"
                        />
                        {song.artwork && (
                          <img 
                            src={song.artwork} 
                            alt={`${song.album} artwork`}
                            className="w-12 h-12 rounded object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{song.name}</p>
                          <p className="text-sm text-gray-600">{song.artist} • {song.album}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant="secondary">{song.genre}</Badge>
                        <span className="text-sm text-gray-500">{song.year}</span>
                        {song.previewUrl && (
                          <Button size="sm" variant="ghost">
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
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
    </div>
  )
}