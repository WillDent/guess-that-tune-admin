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
import { ArrowLeft, Save, Shuffle, AlertCircle, RefreshCw, Globe, Lock, X, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useQuestionSets } from '@/hooks/use-question-sets'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { useToast } from '@/hooks/use-toast'
import { errorHandler } from '@/lib/errors/handler'
import { createClient } from '@/utils/supabase/client'
import { QuestionSetGridSkeleton } from '@/components/questions/question-set-grid-skeleton'
import { debounce } from 'lodash'
import { TagInput } from 'emblor'

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
  
  // Form state
  const [setName, setSetName] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [isPublic, setIsPublic] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [questions, setQuestions] = useState<any[]>([])
  const [originalSongIds, setOriginalSongIds] = useState<string[]>([])
  
  // Track unsaved changes
  const [hasChanges, setHasChanges] = useState(false)

  // Fetch all categories and assigned categories
  const [allCategories, setAllCategories] = useState<{ id: string; text: string }[]>([])
  const [assignedCategories, setAssignedCategories] = useState<{ id: string; text: string }[]>([])
  const [catLoading, setCatLoading] = useState(true)
  const [catError, setCatError] = useState<string | null>(null)
  const [catSaving, setCatSaving] = useState(false)
  const [catSaveError, setCatSaveError] = useState<string | null>(null)
  const [catSaveSuccess, setCatSaveSuccess] = useState(false)
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null)
  const prevCategoryIds = useRef<string[]>([])
  const saveTimeout = useRef<NodeJS.Timeout | null>(null)

  // Load the question set
  useEffect(() => {
    const loadQuestionSet = async () => {
      console.log('[EDIT-PAGE] Loading question set:', questionSetId)
      try {
        setLoading(true)
        
        // Fetch question set with questions
        console.log('[EDIT-PAGE] Fetching from database...')
        const { data: questionSet, error } = await supabaseClient
          .from('question_sets')
          .select(`
            *,
            questions (*)
          `)
          .eq('id', questionSetId)
          .single()
          
        console.log('[EDIT-PAGE] Fetch result:', { questionSet, error })
          
        if (error || !questionSet) {
          console.error('[EDIT-PAGE] Error or no data:', error)
          setNotFound(true)
          return
        }
        
        // Check if user owns this question set
        const { data: { user } } = await supabaseClient.auth.getUser()
        if (!user || questionSet.user_id !== user.id) {
          toast.error('You do not have permission to edit this question set')
          router.push('/questions')
          return
        }
        
        // Set form values
        console.log('[EDIT-PAGE] Setting form values from:', questionSet)
        setSetName(questionSet.name)
        setDescription(questionSet.description || '')
        setDifficulty(questionSet.difficulty as 'easy' | 'medium' | 'hard')
        setIsPublic(questionSet.is_public || false)
        setTags(questionSet.tags || [])
        setQuestions(questionSet.questions || [])
        
        // Extract original song IDs
        const songIds = questionSet.questions.map((q: any) => q.correct_song_id)
        setOriginalSongIds(songIds)
        console.log('[EDIT-PAGE] Form values set successfully')
        
      } catch (error) {
        console.error('[EDIT-PAGE] Error in loadQuestionSet:', error)
        const appError = errorHandler.handle(error)
        toast.error(errorHandler.getErrorMessage(appError))
        setNotFound(true)
      } finally {
        console.log('[EDIT-PAGE] Setting loading to false')
        setLoading(false)
      }
    }
    
    loadQuestionSet()
  }, [questionSetId, router, toast])

  // Fetch all categories and assigned categories
  useEffect(() => {
    const fetchCategories = async () => {
      setCatLoading(true)
      setCatError(null)
      try {
        const res = await fetch('/api/admin/categories')
        const categories = await res.json()
        setAllCategories(categories.map((c: any) => ({ id: c.id, text: c.name })))
        // Fetch assigned categories for this question set
        const res2 = await fetch(`/api/questions/${questionSetId}/categories`)
        const assigned = await res2.json()
        setAssignedCategories(assigned.map((c: any) => ({ id: c.category_id, text: c.category_name })))
      } catch (err) {
        setCatError('Failed to load categories')
      }
      setCatLoading(false)
    }
    if (questionSetId) fetchCategories()
  }, [questionSetId])

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
        is_public: isPublic,
        tags: tags.length > 0 ? tags : null
      })
    }
  }, [setName, description, difficulty, isPublic, tags, hasChanges, loading, debouncedAutoSave])

  // Mark form as changed
  const markAsChanged = () => setHasChanges(true)

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()])
        setTagInput('')
        markAsChanged()
      }
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
    markAsChanged()
  }

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
          is_public: isPublic,
          tags: tags.length > 0 ? tags : null
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

  // Debounced save handler for category assignments
  useEffect(() => {
    if (catLoading) return
    const newCategoryIds = assignedCategories.map((c) => c.id).sort()
    if (JSON.stringify(newCategoryIds) === JSON.stringify(prevCategoryIds.current)) return
    // Debounce: clear previous timeout
    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(async () => {
      setCatSaving(true)
      setCatSaveError(null)
      setCatSaveSuccess(false)
      try {
        const res = await fetch(`/api/questions/${questionSetId}/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoryIds: newCategoryIds }),
        })
        if (!res.ok) {
          const data = await res.json()
          setCatSaveError(data.error || 'Failed to save categories')
        } else {
          setCatSaveSuccess(true)
          prevCategoryIds.current = newCategoryIds
        }
      } catch (err) {
        setCatSaveError('Failed to save categories')
      }
      setCatSaving(false)
    }, 600) // 600ms debounce
    // Cleanup
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current)
    }
  }, [assignedCategories, questionSetId, catLoading])

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

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tags
                  </label>
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="Add tags (press Enter)"
                  />
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="cursor-pointer"
                          onClick={() => removeTag(tag)}
                        >
                          {tag}
                          <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <label className="block font-medium mb-2">Categories</label>
                  {catLoading ? (
                    <div>Loading categories...</div>
                  ) : catError ? (
                    <div className="text-red-500">{catError}</div>
                  ) : (
                    <>
                      <TagInput
                        tags={assignedCategories}
                        setTags={setAssignedCategories}
                        autocompleteOptions={allCategories}
                        activeTagIndex={activeTagIndex}
                        setActiveTagIndex={setActiveTagIndex}
                        placeholder="Assign categories..."
                      />
                      {catSaving && <div className="text-sm text-gray-500 mt-1">Saving...</div>}
                      {catSaveError && <div className="text-sm text-red-500 mt-1">{catSaveError}</div>}
                      {catSaveSuccess && <div className="text-sm text-green-600 mt-1">Categories saved!</div>}
                    </>
                  )}
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
      </div>
    </ProtectedRoute>
  )
}