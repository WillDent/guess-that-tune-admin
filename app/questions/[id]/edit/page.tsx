// ABOUTME: Edit question set page for modifying existing sets
// ABOUTME: Allows changing name, difficulty, and regenerating questions
'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Save, Shuffle, AlertCircle, RefreshCw, Globe, Lock, Loader2, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useQuestionSets } from '@/hooks/use-question-sets'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useToast } from '@/hooks/use-toast'
import { errorHandler } from '@/lib/errors/handler'
import { createClient } from '@/lib/supabase/client'
import { QuestionSetGridSkeleton } from '@/components/questions/question-set-grid-skeleton'
import { debounce } from 'lodash'
import { ArtworkUpload } from '@/components/question-sets/artwork-upload'
import { CategorySelector } from '@/components/categories/category-selector'
import { TagInput } from '@/components/tags/tag-input'
import { GameType, GAME_TYPES, gameTypeLabels, gameTypeDescriptions } from '@/types/game-type'
import { AISuggestionsModal } from '@/components/ai/ai-suggestions-modal'
import { AIArtworkModal } from '@/components/ai/ai-artwork-modal'

export default function EditQuestionSetPage() {
  const router = useRouter()
  const params = useParams()
  const questionSetId = params.id as string
  const { updateQuestionSet } = useQuestionSets()
  const { toast } = useToast()
  const supabaseClient = createClient()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  
  // Form state
  const [setName, setSetName] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [gameType, setGameType] = useState<GameType>(GAME_TYPES.GUESS_ARTIST)
  const [isPublic, setIsPublic] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [questions, setQuestions] = useState<any[]>([])
  const [originalSongIds, setOriginalSongIds] = useState<string[]>([])
  const [artworkUrl, setArtworkUrl] = useState<string | null>(null)
  const [state, setState] = useState<'NEW' | 'PUBLISHED'>('NEW')
  
  // Track unsaved changes
  const [hasChanges, setHasChanges] = useState(false)
  
  // AI suggestions state
  const [showAISuggestions, setShowAISuggestions] = useState(false)
  const [aiContext, setAiContext] = useState('')
  const [showAIArtwork, setShowAIArtwork] = useState(false)

  // Categories state
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const hasLoadedData = useRef(false)

  // Load the question set
  useEffect(() => {
    // Skip if no questionSetId or already loaded data
    if (!questionSetId || hasLoadedData.current) return
    
    // Mark as loaded immediately to prevent concurrent calls
    hasLoadedData.current = true
    
    const loadQuestionSet = async () => {
      console.log('[EDIT-PAGE] Loading question set:', questionSetId)
      try {
        setLoading(true)
        
        // Fetch question set with questions using API endpoint to avoid SDK hanging
        console.log('[EDIT-PAGE] Fetching from API endpoint...')
        
        // Add timeout to prevent indefinite hanging
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
        
        const response = await fetch(`/api/questions/${questionSetId}/details`, {
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid response from server - not JSON')
        }
        
        const responseData = await response.json()
        console.log('[EDIT-PAGE] API response:', { status: response.status, data: responseData })
        
        if (!response.ok) {
          console.error('[EDIT-PAGE] API error:', responseData.error)
          if (response.status === 403) {
            toast.error('You do not have permission to edit this question set')
            router.push('/questions')
            return
          }
          throw new Error(responseData.error || 'Failed to fetch question set')
        }
        
        const questionSet = responseData
        
        if (!questionSet) {
          console.error('[EDIT-PAGE] No data returned')
          setNotFound(true)
          return
        }
        
        // Set form values
        console.log('[EDIT-PAGE] Setting form values from:', questionSet)
        setSetName(questionSet.name)
        setDescription(questionSet.description || '')
        setDifficulty(questionSet.difficulty as 'easy' | 'medium' | 'hard')
        setGameType(questionSet.game_type || GAME_TYPES.GUESS_ARTIST)
        setIsPublic(questionSet.is_public || false)
        setTags(questionSet.tags || [])
        setQuestions(questionSet.questions || [])
        setArtworkUrl(questionSet.artwork_url || null)
        setState(questionSet.state || 'NEW')
        
        // Extract original song IDs
        const songIds = questionSet.questions.map((q: any) => q.correct_song_id)
        setOriginalSongIds(songIds)
        console.log('[EDIT-PAGE] Form values set successfully')
        
        // Mark data as loaded to prevent re-fetching
        setDataLoaded(true)
        
      } catch (error: any) {
        console.error('[EDIT-PAGE] Error in loadQuestionSet:', error)
        
        if (error.name === 'AbortError') {
          toast.error('Request timed out. The server may be experiencing issues. Please try again.')
        } else {
          const appError = errorHandler.handle(error)
          toast.error(errorHandler.getErrorMessage(appError))
        }
        
        setNotFound(true)
      } finally {
        console.log('[EDIT-PAGE] Setting loading to false')
        setLoading(false)
      }
    }
    
    loadQuestionSet()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionSetId]) // Only depend on questionSetId, router and toast are stable

  // Load assigned categories for this question set
  useEffect(() => {
    const loadAssignedCategories = async () => {
      // Only load categories after question set data is loaded
      if (!questionSetId || !dataLoaded) return
      
      console.log('[EDIT-PAGE] Loading assigned categories for:', questionSetId, 'dataLoaded:', dataLoaded)
      try {
        const response = await fetch(`/api/questions/${questionSetId}/categories`)
        console.log('[EDIT-PAGE] Categories API response status:', response.status)
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          console.error('[EDIT-PAGE] Categories API returned non-JSON response')
          return
        }
        
        if (response.ok) {
          const assigned = await response.json()
          console.log('[EDIT-PAGE] Assigned categories:', assigned)
          setSelectedCategoryIds(assigned.map((c: any) => c.category_id))
        }
      } catch (err) {
        console.error('[EDIT-PAGE] Failed to load categories:', err)
      }
    }
    
    loadAssignedCategories()
  }, [questionSetId, dataLoaded]) // Add dataLoaded as dependency

  // Auto-save functionality
  const debouncedAutoSave = useMemo(
    () => debounce(async (updates: any) => {
      if (!hasChanges) return
      
      setAutoSaving(true)
      try {
        const { error } = await updateQuestionSet(
          questionSetId,
          updates
        )
        
        if (!error) {
          setHasChanges(false)
          toast.success('Changes auto-saved', 'Your changes have been saved automatically')
        }
      } catch (error) {
        console.error('Auto-save failed:', error)
      } finally {
        setAutoSaving(false)
      }
    }, 2000),
    [questionSetId, updateQuestionSet, hasChanges, toast]
  )

  // Track changes and trigger auto-save
  useEffect(() => {
    if (hasChanges && !loading) {
      debouncedAutoSave({
        name: setName,
        description: description || null,
        difficulty,
        game_type: gameType,
        is_public: isPublic,
        tags: tags.length > 0 ? tags : null,
        artwork_url: artworkUrl,
        state
      })
    }
  }, [setName, description, difficulty, gameType, isPublic, tags, artworkUrl, state, hasChanges, loading, debouncedAutoSave])

  // Mark form as changed
  const markAsChanged = () => setHasChanges(true)
  
  // Prepare songs data for AI suggestions
  const songsForAI = useMemo(() => {
    return questions.map(q => ({
      id: q.correct_song_id || q.correctSong?.id || '',
      name: q.correct_song_name || q.correctSong?.name || '',
      artist: q.correct_song_artist || q.correctSong?.artist || '',
      album: q.correct_song_album || q.correctSong?.album,
      genre: undefined // We don't have genre data in questions
    }))
  }, [questions])

  const regenerateQuestions = async () => {
    setRegenerating(true)
    try {
      const response = await fetch('/api/questions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedSongIds: originalSongIds,
          difficulty,
          gameType,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to regenerate questions')
      }

      const data = await response.json()
      setQuestions(data.questions)
      setHasChanges(true)
      toast.success('Questions regenerated successfully!')
    } catch (error) {
      const appError = errorHandler.handle(error)
      toast.error(errorHandler.getErrorMessage(appError))
    } finally {
      setRegenerating(false)
    }
  }

  const handleSave = async () => {
    if (!setName.trim()) {
      toast.error('Please enter a name for the question set')
      return
    }

    setSaving(true)
    try {
      // Transform questions to match Supabase schema
      const transformedQuestions = questions.map((q, index) => ({
        correct_song_id: q.correctSong?.id || q.correct_song_id,
        correct_song_name: q.correctSong?.name || q.correct_song_name,
        correct_song_artist: q.correctSong?.artist || q.correct_song_artist,
        correct_song_album: (q.correctSong?.album || q.correct_song_album) || null,
        correct_song_artwork_url: (q.correctSong?.artwork || q.correct_song_artwork_url) || null,
        correct_song_preview_url: (q.correctSong?.previewUrl || q.correct_song_preview_url) || null,
        order_index: index,
        detractors: q.detractors || q.detractors
      }))

      const { error } = await updateQuestionSet(
        questionSetId,
        {
          name: setName,
          description: description || null,
          difficulty,
          game_type: gameType,
          is_public: isPublic,
          tags: tags.length > 0 ? tags : null,
          artwork_url: artworkUrl,
          state
        },
        transformedQuestions
      )

      if (error) {
        throw error
      }
      
      setHasChanges(false)
      toast.success('Question set updated successfully!')
      router.push('/questions')
    } catch (error) {
      const appError = errorHandler.handle(error)
      toast.error(errorHandler.getErrorMessage(appError))
    } finally {
      setSaving(false)
    }
  }

  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasChanges])

  // Save categories when they change
  const handleCategoryChange = useCallback(async (categoryIds: string[]) => {
    console.log('[EDIT-PAGE] Updating categories:', categoryIds)
    setSelectedCategoryIds(categoryIds)
    
    // Don't make API call during initial load
    if (!dataLoaded) {
      console.log('[EDIT-PAGE] Skipping category update - data not loaded yet')
      return
    }
    
    try {
      const response = await fetch(`/api/questions/${questionSetId}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryIds }),
      })
      
      console.log('[EDIT-PAGE] Category update response:', response.status)
      
      if (!response.ok) {
        const data = await response.json()
        toast.error('Failed to save categories', data.error || 'Unknown error')
      } else {
        toast.success('Categories updated')
      }
    } catch (err) {
      console.error('Failed to save categories:', err)
      toast.error('Failed to save categories')
    }
  }, [questionSetId, toast, dataLoaded])

  if (loading) {
    return (
      <ProtectedRoute>
        <div>
          <Link href="/questions">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Questions
            </Button>
          </Link>
          <QuestionSetGridSkeleton />
        </div>
      </ProtectedRoute>
    )
  }

  if (notFound) {
    return (
      <ProtectedRoute>
        <div>
          <Link href="/questions">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Questions
            </Button>
          </Link>

          <Card className="p-12">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-semibold mb-2">Question Set Not Found</h2>
              <p className="text-gray-600 mb-6">
                The question set you're looking for doesn't exist or you don't have permission to edit it.
              </p>
              <Link href="/questions">
                <Button>View All Question Sets</Button>
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
          <Link href="/questions">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Questions
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Question Set</h1>
              <p className="mt-2 text-gray-600">
                Modify your question set configuration and questions
              </p>
            </div>
            {autoSaving && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Auto-saving...
              </div>
            )}
          </div>
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
                    onChange={(e) => {
                      setSetName(e.target.value)
                      markAsChanged()
                    }}
                    placeholder="e.g. 80s Rock Classics"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description (optional)
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value)
                      markAsChanged()
                    }}
                    placeholder="Describe this question set..."
                    rows={3}
                  />
                </div>

                {/* AI Context Input */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    AI Context (optional)
                  </label>
                  <Textarea
                    value={aiContext}
                    onChange={(e) => setAiContext(e.target.value)}
                    placeholder="E.g., 'for a summer party', 'nostalgic vibes', 'focus on guitar solos'..."
                    rows={2}
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Provide additional context to guide the AI suggestions
                  </p>
                </div>

                {/* AI Suggestions Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAISuggestions(true)}
                  className="w-full"
                  disabled={questions.length === 0}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Get AI Suggestions for Name & Description
                </Button>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Game Type
                  </label>
                  <Select 
                    value={gameType} 
                    onValueChange={(v: GameType) => {
                      setGameType(v)
                      markAsChanged()
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={GAME_TYPES.GUESS_ARTIST}>
                        <div>
                          <div className="font-medium">{gameTypeLabels[GAME_TYPES.GUESS_ARTIST]}</div>
                          <div className="text-xs text-gray-500">{gameTypeDescriptions[GAME_TYPES.GUESS_ARTIST]}</div>
                        </div>
                      </SelectItem>
                      <SelectItem value={GAME_TYPES.GUESS_SONG}>
                        <div>
                          <div className="font-medium">{gameTypeLabels[GAME_TYPES.GUESS_SONG]}</div>
                          <div className="text-xs text-gray-500">{gameTypeDescriptions[GAME_TYPES.GUESS_SONG]}</div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Difficulty
                  </label>
                  <Select 
                    value={difficulty} 
                    onValueChange={(v: any) => {
                      setDifficulty(v)
                      markAsChanged()
                    }}
                  >
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

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Status
                  </label>
                  <Select 
                    value={state} 
                    onValueChange={(v: 'NEW' | 'PUBLISHED') => {
                      setState(v)
                      markAsChanged()
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEW">New - Not yet published</SelectItem>
                      <SelectItem value="PUBLISHED">Published - Available to play</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="public-toggle">
                      {isPublic ? (
                        <span className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Public Set
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Private Set
                        </span>
                      )}
                    </Label>
                    <Switch
                      id="public-toggle"
                      checked={isPublic}
                      onCheckedChange={(checked) => {
                        setIsPublic(checked)
                        markAsChanged()
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    {isPublic ? 'Others can play and fork this set' : 'Only you can see this set'}
                  </p>
                </div>

                <div className="mt-6">
                  <CategorySelector
                    selectedCategoryIds={selectedCategoryIds}
                    onCategoryChange={handleCategoryChange}
                  />
                </div>

                <div className="mt-6">
                  <TagInput
                    tags={tags}
                    onTagsChange={(newTags) => {
                      setTags(newTags)
                      markAsChanged()
                    }}
                    placeholder="Add tags (press Enter)"
                    maxTags={10}
                  />
                </div>

                <div className="mt-6">
                  <label className="block font-medium mb-2">Artwork</label>
                  <ArtworkUpload
                    currentArtworkUrl={artworkUrl}
                    onUpload={(url) => {
                      setArtworkUrl(url)
                      setHasChanges(true)
                    }}
                    onRemove={() => {
                      setArtworkUrl(null)
                      setHasChanges(true)
                    }}
                    onGenerateAI={() => setShowAIArtwork(true)}
                    questionSetId={questionSetId}
                  />
                </div>


                <div className="pt-4 space-y-2">
                  <Button 
                    onClick={regenerateQuestions} 
                    disabled={regenerating}
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${regenerating ? 'animate-spin' : ''}`} />
                    {regenerating ? 'Regenerating...' : 'Regenerate Detractors'}
                  </Button>
                  
                  <Button 
                    onClick={handleSave} 
                    disabled={saving || !hasChanges}
                    className="w-full"
                  >
                    {saving ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Saving...
                      </>
                    ) : !hasChanges ? (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        All Changes Saved
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save All Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Question Stats */}
            <Card className="p-6 mt-6">
              <h3 className="font-semibold mb-4">Question Stats</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Total Questions: <span className="font-medium">{questions.length}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Songs Used: <span className="font-medium">{originalSongIds.length}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Detractors per Question: <span className="font-medium">3</span>
                </p>
                {hasChanges && (
                  <p className="text-sm text-yellow-600 font-medium">
                    You have unsaved changes
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Questions Preview */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">Questions Preview</h2>
                <Badge variant="outline" className="text-gray-600">
                  {questions.length} Questions
                </Badge>
              </div>

              <div className="space-y-6">
                {questions.map((question, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-500">Q{idx + 1}</span>
                        {(question.correctSong?.artwork || question.correct_song_artwork_url) && (
                          <img 
                            src={question.correctSong?.artwork || question.correct_song_artwork_url} 
                            alt={question.correctSong?.album || question.correct_song_album}
                            className="w-12 h-12 rounded"
                          />
                        )}
                        <div>
                          <p className="font-medium">{question.correctSong?.name || question.correct_song_name}</p>
                          <p className="text-sm text-gray-600">{question.correctSong?.artist || question.correct_song_artist}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Correct Answer
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                      {(question.detractors || []).map((detractor: any, dIdx: number) => (
                        <div key={detractor.id || dIdx} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
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
            </Card>
          </div>
        </div>

        {/* AI Suggestions Modal */}
        <AISuggestionsModal
          isOpen={showAISuggestions}
          onClose={() => setShowAISuggestions(false)}
          onAccept={(name, desc) => {
            setSetName(name)
            setDescription(desc)
            setShowAISuggestions(false)
            markAsChanged()
            toast.success('AI suggestions applied!')
          }}
          songs={songsForAI}
          gameType={gameType as 'guess_artist' | 'guess_song'}
          difficulty={difficulty}
          userContext={aiContext}
        />

        {/* AI Artwork Modal */}
        <AIArtworkModal
          isOpen={showAIArtwork}
          onClose={() => setShowAIArtwork(false)}
          onAccept={async (imageUrl) => {
            try {
              setArtworkUrl(imageUrl)
              setHasChanges(true)
              setShowAIArtwork(false)
              toast.success('AI artwork generated!')
            } catch (error) {
              toast.error('Failed to save artwork')
            }
          }}
          songs={songsForAI}
          gameType={gameType as 'guess_artist' | 'guess_song'}
        />
      </div>
    </ProtectedRoute>
  )
}