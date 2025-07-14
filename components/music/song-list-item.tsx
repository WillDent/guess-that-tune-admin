'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AddToCartButton } from '@/components/cart/add-to-cart-button'
import { CartSong } from '@/types/cart'
import { Play, Music } from 'lucide-react'

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

interface SongListItemProps {
  song: Song
  mapSongToCartSong: (song: Song) => CartSong
}

export function SongListItem({ song, mapSongToCartSong }: SongListItemProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-4 flex-1 min-w-0">
        {song.artwork ? (
          <img 
            src={song.artwork} 
            alt={`${song.album} artwork`}
            className="w-12 h-12 rounded object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
            <Music className="h-6 w-6 text-gray-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{song.name}</p>
          <p className="text-sm text-gray-600 truncate">{song.artist} • {song.album}</p>
        </div>
      </div>
      <div className="flex items-center space-x-3 flex-shrink-0">
        <Badge variant="secondary" className="hidden sm:inline-flex">{song.genre}</Badge>
        <span className="text-sm text-gray-500 hidden sm:inline">{song.year}</span>
        {song.previewUrl && (
          <Button size="sm" variant="ghost" className="hidden sm:inline-flex">
            <Play className="h-4 w-4" />
          </Button>
        )}
        <AddToCartButton song={mapSongToCartSong(song)} />
      </div>
    </div>
  )
}