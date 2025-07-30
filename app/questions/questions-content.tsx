// ABOUTME: Client component for questions page interactivity
// ABOUTME: Handles preview, delete, and other interactive features
'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Play, Trash2, Music, AlertCircle, RefreshCw, Edit } from 'lucide-react'
import Link from 'next/link'
import { PreviewModal } from '@/components/questions/preview-modal'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { errorHandler } from '@/lib/errors/handler'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import { useRouter } from 'next/navigation'
import { ArtworkImage } from '@/components/ui/artwork-image'
import type { QuestionSetWithQuestions } from './page'
import type { Question } from '@/types'
import { GAME_TYPES, GameType, gameTypeLabels } from '@/types/game-type'

interface QuestionsContentProps {
  initialQuestionSets: QuestionSetWithQuestions[]
  userId: string
}

export function QuestionsContent({ initialQuestionSets, userId }: QuestionsContentProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [questionSets, setQuestionSets] = useState(initialQuestionSets)
  const [previewSet, setPreviewSet] = useState<any>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const supabase = createSupabaseBrowserClient()

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this question set?')) {
      console.log('[DELETE] Starting delete for question set:', id)
      setIsDeleting(id)
      
      try {
        // Skip SDK and use direct API call to avoid hanging
        console.log('[DELETE] Using direct API to delete...')
        const response = await fetch('/api/auth/session')
        
        if (!response.ok) {
          throw new Error('Failed to get session')
        }
        
        const { token } = await response.json()
        
        const deleteResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/question_sets?id=eq.${id}&user_id=eq.${userId}`, {
          method: 'DELETE',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          }
        })
        
        if (!deleteResponse.ok) {
          const errorText = await deleteResponse.text()
          console.error('[DELETE] API delete failed:', deleteResponse.status, errorText)
          throw new Error('Failed to delete question set')
        }
        
        console.log('[DELETE] Delete successful')
        toast.success('Question set deleted successfully')
        
        // Remove from local state
        setQuestionSets(questionSets.filter(set => set.id !== id))
        
        // Force a page refresh after a short delay
        setTimeout(() => {
          router.refresh()
        }, 500)
        
      } catch (error) {
        console.error('[DELETE] Error:', error)
        const appError = errorHandler.handle(error)
        toast.error(errorHandler.getErrorMessage(appError))
      } finally {
        setIsDeleting(null)
      }
    }
  }

  const handlePreview = (set: QuestionSetWithQuestions) => {
    // Transform Supabase data to match expected format
    const transformedSet = {
      id: set.id,
      name: set.name,
      description: set.description,
      difficulty: set.difficulty,
      questionCount: set.questions.length,
      playCount: set.play_count || 0,
      createdAt: set.created_at,
      questions: set.questions.map((q: any) => ({
        ...q,
        type: q.type as 'multiple_choice' | 'true_false' | 'fill_in_the_blank',
        wrongAnswers: q.wrong_answers || []
      })) as Question[]
    }
    setPreviewSet(transformedSet)
    setIsPreviewOpen(true)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 border-green-600'
      case 'medium': return 'text-yellow-600 border-yellow-600'
      case 'hard': return 'text-red-600 border-red-600'
      default: return ''
    }
  }

  const handleRefresh = () => {
    router.refresh()
  }

  return (
    <>
      {questionSets.length === 0 ? (
        <div className="text-center py-12">
          <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No question sets yet
          </h3>
          <p className="text-gray-500 mb-6">
            Create your first question set to start playing
          </p>
          <Link href="/questions/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Set
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
            <p className="text-sm sm:text-base text-gray-600">
              {questionSets.length} question set{questionSets.length !== 1 ? 's' : ''}
            </p>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={handleRefresh} className="flex-1 sm:flex-initial">
                <RefreshCw className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Link href="/questions/new" className="flex-1 sm:flex-initial">
                <Button size="sm" className="w-full">
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Create New Set</span>
                  <span className="sm:hidden">Create</span>
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {questionSets.map((set) => (
              <Card key={set.id} className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <div className="flex-1 mr-2">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                      {set.name}
                    </h3>
                    {set.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {set.description}
                      </p>
                    )}
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`ml-2 text-xs sm:text-sm ${getDifficultyColor(set.difficulty)}`}
                  >
                    {set.difficulty}
                  </Badge>
                </div>

                {set.artwork_url && (
                  <div className="mb-3 sm:mb-4 -mx-4 sm:-mx-6 -mt-2">
                    <ArtworkImage
                      src={set.artwork_url} 
                      alt={set.name}
                      className="w-full h-24 sm:h-32 object-cover"
                      fallbackClassName="w-full h-24 sm:h-32 bg-gray-100"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                  <span>{set.questions.length} questions</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {gameTypeLabels[(set.game_type as GameType) || GAME_TYPES.GUESS_ARTIST]}
                    </Badge>
                    {set.state === 'PUBLISHED' ? (
                      <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                        Published
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Draft
                      </Badge>
                    )}
                    {set.is_public && (
                      <Badge variant="secondary" className="text-xs">
                        Public
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-1 sm:gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handlePreview(set)}
                  >
                    <Play className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Preview</span>
                  </Button>
                  <Link href={`/questions/${set.id}/edit`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Edit className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(set.id)}
                    disabled={isDeleting === set.id}
                    className="px-2 sm:px-3"
                  >
                    {isDeleting === set.id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false)
          setPreviewSet(null)
        }}
        questionSet={previewSet}
      />
    </>
  )
}