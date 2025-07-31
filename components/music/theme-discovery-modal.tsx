'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/hooks/use-toast'
import { errorHandler } from '@/lib/errors/handler'
import { 
  Music, 
  Sparkles, 
  Brain, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Lightbulb,
  Search,
  TrendingUp
} from 'lucide-react'

interface ThemeDiscoveryModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectSongs: (songs: any[]) => void
  onGenerateQuestions?: (theme: string, songs: any[]) => void
}

interface ThemePreset {
  id: string
  name: string
  theme: string
  description: string
}

interface MatchedSong {
  suggestion: {
    title: string
    artist: string
    reason: string
    confidence: string
  }
  appleMusicSong: {
    id: string
    name: string
    artist: string
    artwork: string
    previewUrl: string | null
  } | null
  matchConfidence: number
  matchStrategy: string
}

export function ThemeDiscoveryModal({ isOpen, onClose, onSelectSongs, onGenerateQuestions }: ThemeDiscoveryModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [presets, setPresets] = useState<ThemePreset[]>([])
  const [customTheme, setCustomTheme] = useState('')
  const [customDescription, setCustomDescription] = useState('')
  const [results, setResults] = useState<{
    interpretation: string
    matches: MatchedSong[]
    summary: {
      totalSuggestions: number
      matchedCount: number
      successRate: number
    }
  } | null>(null)
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set())

  // Load preset themes on mount
  useEffect(() => {
    if (isOpen) {
      loadPresets()
    }
  }, [isOpen])

  const loadPresets = async () => {
    try {
      const response = await fetch('/api/music/theme-presets')
      const data = await response.json()
      setPresets(data.presets)
    } catch (error) {
      console.error('Failed to load presets:', error)
    }
  }

  const discoverByTheme = async (theme: string, description?: string) => {
    setLoading(true)
    setResults(null)
    setSelectedSongs(new Set())

    try {
      const response = await fetch('/api/music/discover-by-theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme,
          description,
          constraints: {
            count: 20,
            explicitAllowed: true
          }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to discover songs')
      }

      const data = await response.json()
      setResults(data)
      
      // Auto-select all matched songs
      const matchedIds = data.matches
        .filter((m: MatchedSong) => m.appleMusicSong)
        .map((m: MatchedSong) => m.appleMusicSong!.id)
      setSelectedSongs(new Set(matchedIds))

      toast.success(`Found ${data.summary.matchedCount} songs matching your theme!`)
    } catch (error) {
      console.error('[ThemeDiscovery] Error:', error)
      const appError = errorHandler.handle(error)
      toast.error(errorHandler.getErrorMessage(appError))
    } finally {
      setLoading(false)
    }
  }

  const handlePresetClick = (preset: ThemePreset) => {
    discoverByTheme(preset.theme, preset.description)
  }

  const handleCustomSearch = () => {
    if (!customTheme.trim()) {
      toast.error('Please enter a theme')
      return
    }
    discoverByTheme(customTheme, customDescription)
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

  const handleAddSelected = () => {
    if (!results) return
    
    const selected = results.matches
      .filter(match => match.appleMusicSong && selectedSongs.has(match.appleMusicSong.id))
      .map(match => ({
        id: match.appleMusicSong!.id,
        name: match.appleMusicSong!.name,
        artist: match.appleMusicSong!.artist,
        artwork: match.appleMusicSong!.artwork,
        previewUrl: match.appleMusicSong!.previewUrl,
        // Include AI reasoning
        aiReason: match.suggestion.reason
      }))
    
    onSelectSongs(selected)
    onClose()
  }

  const getMatchIcon = (matchStrategy: string, matchConfidence: number) => {
    if (matchStrategy === 'exact' || matchConfidence >= 0.9) {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />
    } else if (matchStrategy === 'not_found') {
      return <XCircle className="h-4 w-4 text-red-600" />
    } else {
      return <AlertCircle className="h-4 w-4 text-yellow-600" />
    }
  }

  const getConfidenceBadge = (confidence: string) => {
    const colors = {
      high: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-orange-100 text-orange-800'
    }
    return colors[confidence as keyof typeof colors] || colors.medium
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI-Powered Theme Discovery
          </DialogTitle>
          <DialogDescription>
            Describe a theme, mood, or scenario and AI will find matching songs
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {!results ? (
            <Tabs defaultValue="presets" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="presets">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Preset Themes
                </TabsTrigger>
                <TabsTrigger value="custom">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Custom Theme
                </TabsTrigger>
              </TabsList>

              <TabsContent value="presets" className="space-y-4 mt-4">
                <p className="text-sm text-gray-600 mb-4">
                  Click any preset theme to discover matching songs
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {presets.map(preset => (
                    <Card
                      key={preset.id}
                      className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => handlePresetClick(preset)}
                    >
                      <h4 className="font-semibold mb-1">{preset.name}</h4>
                      <p className="text-sm text-gray-600">{preset.theme}</p>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="custom" className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="theme">Theme or Concept</Label>
                  <Input
                    id="theme"
                    placeholder="e.g., Songs about overcoming fear"
                    value={customTheme}
                    onChange={(e) => setCustomTheme(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Additional Context (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Add any specific details, genres, eras, or moods you prefer..."
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={handleCustomSearch}
                  disabled={loading || !customTheme.trim()}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Discovering...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Discover Songs
                    </>
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-4">
              {/* Results header */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">AI Interpretation</h3>
                <p className="text-sm text-gray-700">{results.interpretation}</p>
                <div className="flex gap-4 mt-3 text-sm">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    {results.summary.matchedCount}/{results.summary.totalSuggestions} matched
                  </span>
                  <span className="text-gray-600">
                    {(results.summary.successRate * 100).toFixed(0)}% success rate
                  </span>
                </div>
              </div>

              {/* Song results */}
              <div className="space-y-2">
                {results.matches.map((match, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-3 ${
                      match.appleMusicSong ? 'cursor-pointer hover:bg-gray-50' : 'opacity-60'
                    }`}
                    onClick={() => match.appleMusicSong && toggleSongSelection(match.appleMusicSong.id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Match status icon */}
                      <div className="mt-1">
                        {getMatchIcon(match.matchStrategy, match.matchConfidence)}
                      </div>

                      {/* Song info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">
                              {match.appleMusicSong?.name || match.suggestion.title}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {match.appleMusicSong?.artist || match.suggestion.artist}
                            </p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={getConfidenceBadge(match.suggestion.confidence)}
                          >
                            {match.suggestion.confidence}
                          </Badge>
                        </div>

                        {/* AI reasoning */}
                        <p className="text-sm text-gray-700 mt-2 italic">
                          "{match.suggestion.reason}"
                        </p>

                        {/* Match details */}
                        {match.appleMusicSong && (
                          <div className="flex items-center gap-2 mt-2">
                            <input
                              type="checkbox"
                              checked={selectedSongs.has(match.appleMusicSong.id)}
                              onChange={(e) => e.stopPropagation()}
                              className="h-4 w-4"
                            />
                            <span className="text-xs text-gray-500">
                              Match: {(match.matchConfidence * 100).toFixed(0)}% ({match.matchStrategy})
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Album artwork */}
                      {match.appleMusicSong && (
                        <img
                          src={match.appleMusicSong.artwork}
                          alt={match.appleMusicSong.name}
                          className="w-12 h-12 rounded"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex justify-between items-center pt-4 border-t">
                <Button variant="outline" onClick={() => setResults(null)}>
                  <Search className="h-4 w-4 mr-2" />
                  New Search
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  {onGenerateQuestions && selectedSongs.size >= 5 && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        const selected = results.matches
                          .filter(match => match.appleMusicSong && selectedSongs.has(match.appleMusicSong.id))
                          .map(match => ({
                            ...match.appleMusicSong!,
                            aiReason: match.suggestion.reason
                          }))
                        onGenerateQuestions(results.interpretation, selected)
                      }}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Questions
                    </Button>
                  )}
                  <Button 
                    onClick={handleAddSelected}
                    disabled={selectedSongs.size === 0}
                  >
                    <Music className="h-4 w-4 mr-2" />
                    Add {selectedSongs.size} to Cart
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}