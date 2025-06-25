// ABOUTME: Create new question set page with song selection from session
// ABOUTME: Allows configuring difficulty and generating detractors
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Shuffle, Music, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useQuestionSets } from '@/hooks/use-question-sets'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useToast } from '@/hooks/use-toast'
import { errorHandler } from '@/lib/errors/handler'

interface SelectedSong {
  id: string
  name: string
  artist: string
  album: string
  genre: string
  artwork: string
}

export default function NewQuestionSetPage() {
  const router = useRouter()
  const { createQuestionSet } = useQuestionSets()
  const { toast } = useToast()
  const [setName, setSetName] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [selectedSongs, setSelectedSongs] = useState<SelectedSong[]>([])
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<any[]>([])

  // Load selected songs from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('selectedSongs')
    if (stored) {
      setSelectedSongs(JSON.parse(stored))
      sessionStorage.removeItem('selectedSongs') // Clear after loading
    }
  }, [])

  const generatePreview = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/questions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedSongIds: selectedSongs.map(s => s.id),
          difficulty,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate questions')
      }

      const data = await response.json()
      setPreview(data.questions)
      toast.success('Questions generated successfully!')
    } catch (error) {
      const appError = errorHandler.handle(error)
      toast.error(errorHandler.getErrorMessage(appError))
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!setName.trim()) {
      toast.error('Please enter a name for the question set')
      return
    }

    if (preview.length === 0) {
      toast.error('Please generate questions before saving')
      return
    }

    setSaving(true)
    try {
      // Transform preview data to match Supabase schema
      const questions = preview.map((q, index) => ({
        correct_song_id: q.correctSong.id,
        correct_song_name: q.correctSong.name,
        correct_song_artist: q.correctSong.artist,
        correct_song_album: q.correctSong.album || null,
        correct_song_artwork_url: q.correctSong.artwork || null,
        correct_song_preview_url: q.correctSong.previewUrl || null,
        order_index: index,
        detractors: q.detractors.map((d: any) => ({
          id: d.id,
          name: d.name,
          artist: d.artist,
          album: d.album || '',
          artwork: d.artwork || '',
          previewUrl: d.previewUrl || ''
        }))
      }))

      const { error } = await createQuestionSet(
        setName,
        description || null,
        difficulty,
        questions
      )

      if (error) {
        throw error
      }
      
      // Clear the selected songs from session storage
      sessionStorage.removeItem('selectedSongs')
      
      toast.success('Question set saved successfully!')
      
      // Redirect to questions page
      router.push('/questions')
    } catch (error) {
      const appError = errorHandler.handle(error)
      toast.error(errorHandler.getErrorMessage(appError))
    } finally {
      setSaving(false)
    }
  }

  if (selectedSongs.length === 0) {
    return (
      <ProtectedRoute>
        <div>
          <Link href="/browse">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Browse
            </Button>
          </Link>

          <Card className="p-12">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
              <h2 className="text-xl font-semibold mb-2">No Songs Selected</h2>
              <p className="text-gray-600 mb-6">
                Please select songs from the music browser first
              </p>
              <Link href="/browse">
                <Button>
                  <Music className="h-4 w-4 mr-2" />
                  Browse Music
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div>
      <div className="mb-8">
        <Link href="/browse">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Browse
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Create Question Set</h1>
        <p className="mt-2 text-gray-600">
          Configure your question set with {selectedSongs.length} selected songs
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Set Name
                </label>
                <Input
                  value={setName}
                  onChange={(e) => setSetName(e.target.value)}
                  placeholder="e.g. 80s Rock Classics"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description (optional)
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe this question set..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Difficulty
                </label>
                <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy - Very different songs</SelectItem>
                    <SelectItem value="medium">Medium - Similar genres</SelectItem>
                    <SelectItem value="hard">Hard - Very similar songs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4">
                <Button 
                  onClick={generatePreview} 
                  disabled={generating}
                  className="w-full"
                >
                  <Shuffle className="h-4 w-4 mr-2" />
                  {generating ? 'Generating...' : 'Generate Detractors'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Selected Songs */}
          <Card className="p-6 mt-6">
            <h3 className="font-semibold mb-4">Selected Songs ({selectedSongs.length})</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {selectedSongs.map((song) => (
                <div key={song.id} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50">
                  <img 
                    src={song.artwork} 
                    alt={song.album}
                    className="w-10 h-10 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{song.name}</p>
                    <p className="text-xs text-gray-600 truncate">{song.artist}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Preview</h2>
              {preview.length > 0 && (
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Question Set
                    </>
                  )}
                </Button>
              )}
            </div>

            {preview.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Shuffle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Click "Generate Detractors" to preview your question set</p>
              </div>
            ) : (
              <div className="space-y-6">
                {preview.map((question, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-500">Q{idx + 1}</span>
                        {question.correctSong.artwork && (
                          <img 
                            src={question.correctSong.artwork} 
                            alt={question.correctSong.album}
                            className="w-12 h-12 rounded"
                          />
                        )}
                        <div>
                          <p className="font-medium">{question.correctSong.name}</p>
                          <p className="text-sm text-gray-600">{question.correctSong.artist}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Correct Answer
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                      {question.detractors.map((detractor: any) => (
                        <div key={detractor.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          {detractor.artwork && (
                            <img 
                              src={detractor.artwork} 
                              alt={detractor.album}
                              className="w-10 h-10 rounded flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{detractor.name}</p>
                            <p className="text-xs text-gray-600 truncate">{detractor.artist}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  )
}