'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, Music, PlayCircle, Plus, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { errorHandler } from '@/lib/errors/handler'
import { useCart } from '@/contexts/cart-context'
import { CartSong } from '@/types/cart'

interface Playlist {
  id: string
  name: string
  description: string
  curator: string
  trackCount: number
  artwork: {
    url: string
    bgColor?: string
    textColor?: string
  } | null
  isChart: boolean
  playlistType: string
  lastModified: string
}

interface PlaylistSong {
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

export function PlaylistBrowser() {
  const { toast } = useToast()
  const { addToCart } = useCart()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null)
  const [playlistTracks, setPlaylistTracks] = useState<PlaylistSong[]>([])
  const [tracksLoading, setTracksLoading] = useState(false)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    fetchPlaylists()
  }, [])

  const fetchPlaylists = async (loadMore = false) => {
    if (loadMore) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    setError(null)
    
    try {
      const currentOffset = loadMore ? offset : 0
      const response = await fetch(`/api/music/playlists?types=mood,activity&limit=25&offset=${currentOffset}`)
      const data = await response.json()
      
      if (!response.ok) throw new Error(data.error || 'Failed to fetch playlists')
      
      if (loadMore) {
        setPlaylists(prev => [...prev, ...data.playlists])
        setOffset(prev => prev + 25)
      } else {
        setPlaylists(data.playlists)
        setOffset(25)
      }
      
      // If we got less than 25, there are no more
      setHasMore(data.playlists.length === 25)
    } catch (err) {
      const appError = errorHandler.handle(err)
      toast.error(errorHandler.getErrorMessage(appError))
      setError(err instanceof Error ? err.message : 'Failed to load playlists')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const fetchPlaylistTracks = async (playlistId: string) => {
    setTracksLoading(true)
    try {
      const response = await fetch(`/api/music/playlists/${playlistId}/tracks`)
      const data = await response.json()
      
      if (!response.ok) throw new Error(data.error || 'Failed to fetch tracks')
      
      setPlaylistTracks(data.songs)
      setSelectedPlaylist(playlistId)
    } catch (err) {
      const appError = errorHandler.handle(err)
      toast.error(errorHandler.getErrorMessage(appError))
    } finally {
      setTracksLoading(false)
    }
  }

  const mapSongToCartSong = (song: PlaylistSong): CartSong => ({
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
    playlistTracks.forEach(song => {
      addToCart(mapSongToCartSong(song))
    })
    toast.success(`${playlistTracks.length} songs added to your cart`, "Added playlist to cart")
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-40 w-full mb-4" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-full" />
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-12">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-500" />
          <p className="text-red-600">{error}</p>
          <Button variant="outline" onClick={() => fetchPlaylists()} className="mt-4">
            Try Again
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Playlists Grid */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.map(playlist => (
            <Card 
              key={playlist.id} 
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => fetchPlaylistTracks(playlist.id)}
            >
              <div className="aspect-square relative bg-gradient-to-br from-gray-100 to-gray-200">
                {playlist.artwork ? (
                  <img 
                    src={playlist.artwork.url}
                    alt={playlist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="h-20 w-20 text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-opacity flex items-center justify-center">
                  <PlayCircle className="h-16 w-16 text-white opacity-0 hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold line-clamp-1">{playlist.name}</h3>
                <p className="text-sm text-gray-600 line-clamp-2 mt-1">{playlist.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-500">{playlist.trackCount} tracks</span>
                  <Badge variant="secondary" className="text-xs">
                    {playlist.curator}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        {/* Load More Button */}
        {hasMore && playlists.length > 0 && (
          <div className="mt-6 text-center">
            <Button 
              variant="outline" 
              onClick={() => fetchPlaylists(true)}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More Playlists'
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Playlist Tracks Modal/Drawer */}
      {selectedPlaylist && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {playlists.find(p => p.id === selectedPlaylist)?.name}
            </h3>
            <div className="flex items-center gap-2">
              {playlistTracks.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleAddAllToCart}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add All ({playlistTracks.length})
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedPlaylist(null)
                  setPlaylistTracks([])
                }}
              >
                Close
              </Button>
            </div>
          </div>

          {tracksLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : playlistTracks.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {playlistTracks.map((track, index) => (
                <div 
                  key={track.id} 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50"
                >
                  <span className="text-sm text-gray-500 w-8">{index + 1}</span>
                  <img 
                    src={track.artwork} 
                    alt={track.name}
                    className="w-12 h-12 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{track.name}</p>
                    <p className="text-sm text-gray-600 truncate">{track.artist}</p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDuration(track.durationMs)}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      addToCart(mapSongToCartSong(track))
                      toast.success(`${track.name} added to cart`)
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Music className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No tracks found</p>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}