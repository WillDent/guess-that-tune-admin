'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Music, Calendar, Heart, PartyPopper, Coffee, Dumbbell, Cloud, Smile, HeartCrack } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { errorHandler } from '@/lib/errors/handler'
import type { AdvancedSearchParams } from '@/lib/apple-music/discovery-service'

interface DiscoveryModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectSongs: (songs: any[]) => void
}

const THEMES = [
  { value: 'love', label: 'Love Songs', icon: Heart },
  { value: 'breakup', label: 'Breakup Songs', icon: HeartCrack },
  { value: 'party', label: 'Party Hits', icon: PartyPopper },
  { value: 'chill', label: 'Chill Vibes', icon: Coffee },
  { value: 'workout', label: 'Workout', icon: Dumbbell },
  { value: 'happy', label: 'Happy Songs', icon: Smile },
  { value: 'sad', label: 'Sad Songs', icon: Cloud },
  { value: 'wedding', label: 'Wedding Songs', icon: Heart },
  { value: 'motivational', label: 'Motivational', icon: Dumbbell }
]

const DECADES = [
  { value: '1960s', label: '1960s' },
  { value: '1970s', label: '1970s' },
  { value: '1980s', label: '1980s' },
  { value: '1990s', label: '1990s' },
  { value: '2000s', label: '2000s' },
  { value: '2010s', label: '2010s' },
  { value: '2020s', label: '2020s' }
]

const GENRES = [
  'Pop', 'Rock', 'R&B', 'Hip-Hop', 'Country', 'Electronic', 
  'Jazz', 'Classical', 'Reggae', 'Soul', 'Blues', 'Metal'
]

export function DiscoveryModal({ isOpen, onClose, onSelectSongs }: DiscoveryModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set())
  
  // Search parameters
  const [theme, setTheme] = useState<string>('')
  const [decade, setDecade] = useState<string>('')
  const [genre, setGenre] = useState<string>('')
  const [yearRange, setYearRange] = useState<[number, number]>([1970, 2024])
  const [explicitAllowed, setExplicitAllowed] = useState(true)
  const [resultLimit, setResultLimit] = useState(30)

  const handleDiscover = async () => {
    if (!theme && !genre) {
      toast.error('Please select at least a theme or genre')
      return
    }

    setLoading(true)
    setResults([])
    setSelectedSongs(new Set())

    try {
      const params: AdvancedSearchParams = {
        theme: theme as any,
        decade: decade as any,
        genre: genre || undefined,
        explicit: explicitAllowed,
        limit: resultLimit
      }

      // If no decade selected but year range adjusted, use year range
      if (!decade && (yearRange[0] !== 1970 || yearRange[1] !== 2024)) {
        params.yearRange = { start: yearRange[0], end: yearRange[1] }
      }

      const response = await fetch('/api/music/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to discover songs')
      }

      const data = await response.json()
      setResults(data.songs)
      
      console.log('[Discovery] Found songs:', data.songs.length)
      console.log('[Discovery] Sources:', data.sources)
      console.log('[Discovery] Query:', data.searchQuery)
      
      if (data.songs.length === 0) {
        toast.error('No songs found matching your criteria')
      } else {
        toast.success(`Found ${data.songs.length} songs!`)
      }
    } catch (error) {
      console.error('[Discovery] Error:', error)
      const appError = errorHandler.handle(error)
      toast.error(errorHandler.getErrorMessage(appError))
    } finally {
      setLoading(false)
    }
  }

  const toggleSongSelection = (songId: string) => {
    const newSelection = new Set(selectedSongs)
    if (newSelection.has(songId)) {
      newSelection.delete(songId)
    } else {
      newSelection.add(songId)
    }
    setSelectedSongs(newSelection)
  }

  const handleSelectAll = () => {
    if (selectedSongs.size === results.length) {
      setSelectedSongs(new Set())
    } else {
      setSelectedSongs(new Set(results.map(s => s.id)))
    }
  }

  const handleAddSelected = () => {
    const selected = results.filter(song => selectedSongs.has(song.id))
    onSelectSongs(selected)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Discover Songs</DialogTitle>
          <DialogDescription>
            Find songs by theme, era, and genre to create the perfect question set
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Search Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Theme Selection */}
            <div>
              <Label>Theme</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a theme" />
                </SelectTrigger>
                <SelectContent>
                  {THEMES.map(t => {
                    const Icon = t.icon
                    return (
                      <SelectItem key={t.value} value={t.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {t.label}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Genre Selection */}
            <div>
              <Label>Genre</Label>
              <Select value={genre} onValueChange={setGenre}>
                <SelectTrigger>
                  <SelectValue placeholder="Any genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any genre</SelectItem>
                  {GENRES.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Decade Selection */}
            <div>
              <Label>Decade</Label>
              <Select value={decade} onValueChange={setDecade}>
                <SelectTrigger>
                  <SelectValue placeholder="Any decade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any decade</SelectItem>
                  {DECADES.map(d => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year Range (if no decade selected) */}
            {!decade && (
              <div>
                <Label>Year Range: {yearRange[0]} - {yearRange[1]}</Label>
                <div className="px-3 py-2">
                  <Slider
                    value={yearRange}
                    onValueChange={(v) => setYearRange(v as [number, number])}
                    min={1960}
                    max={2024}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {/* Explicit Content */}
            <div className="flex items-center justify-between">
              <Label htmlFor="explicit">Include Explicit Content</Label>
              <Switch
                id="explicit"
                checked={explicitAllowed}
                onCheckedChange={setExplicitAllowed}
              />
            </div>

            {/* Result Limit */}
            <div>
              <Label>Max Results: {resultLimit}</Label>
              <div className="px-3 py-2">
                <Slider
                  value={[resultLimit]}
                  onValueChange={(v) => setResultLimit(v[0])}
                  min={10}
                  max={100}
                  step={10}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Discover Button */}
          <div className="flex justify-center">
            <Button 
              onClick={handleDiscover}
              disabled={loading || (!theme && !genre)}
              className="px-8"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Discovering...
                </>
              ) : (
                <>
                  <Music className="h-4 w-4 mr-2" />
                  Discover Songs
                </>
              )}
            </Button>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">
                  Found {results.length} songs
                </h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    {selectedSongs.size === results.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleAddSelected}
                    disabled={selectedSongs.size === 0}
                  >
                    Add {selectedSongs.size} Selected
                  </Button>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.map(song => (
                  <div
                    key={song.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedSongs.has(song.id) 
                        ? 'bg-primary/10 border-primary' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => toggleSongSelection(song.id)}
                  >
                    <img
                      src={song.artwork}
                      alt={song.name}
                      className="w-12 h-12 rounded"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{song.name}</div>
                      <div className="text-sm text-gray-600">
                        {song.artist} • {song.year} • {song.genre}
                      </div>
                    </div>
                    {song.isExplicit && (
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">E</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}