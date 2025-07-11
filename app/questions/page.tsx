// ABOUTME: Questions page showing all created question sets
// ABOUTME: Lists question sets with preview and management options
'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Play, Trash2, Music, AlertCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { PreviewModal } from '@/components/questions/preview-modal'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useQuestionSets } from '@/hooks/use-question-sets'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { QuestionSetGridSkeleton } from '@/components/loading/question-set-skeleton'
import { useToast } from '@/hooks/use-toast'
import { errorHandler } from '@/lib/errors/handler'
import type { Question } from '@/types'

export default function QuestionsPage() {
  const { questionSets, loading, error, deleteQuestionSet, refetch } = useQuestionSets()
  const { toast } = useToast()
  const [previewSet, setPreviewSet] = useState<any>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this question set?')) {
      setIsDeleting(id)
      const { error } = await deleteQuestionSet(id)
      if (error) {
        const appError = errorHandler.handle(error)
        toast.error(errorHandler.getErrorMessage(appError))
      } else {
        toast.success('Question set deleted successfully')
      }
      setIsDeleting(null)
    }
  }

  const handlePreview = (set: any) => {
    // Transform Supabase data to match expected format
    const transformedSet = {
      id: set.id,
      name: set.name,
      description: set.description,
      difficulty: set.difficulty,
      questionCount: set.questions.length,
      playCount: set.play_count || 0,
      createdAt: set.created_at,
      questions: set.questions
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((q: any) => ({
          correctSong: {
            id: q.correct_song_id,
            name: q.correct_song_name,
            artist: q.correct_song_artist,
            album: q.correct_song_album,
            artwork: q.correct_song_artwork_url,
            previewUrl: q.correct_song_preview_url
          },
          detractors: q.detractors as Question['detractors']
        }))
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

  return (
    <ProtectedRoute>
      <div>
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Question Sets</h1>
            <p className="mt-2 text-gray-600">Manage your question collections for games</p>
          </div>
          <Link href="/questions/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New Set
            </Button>
          </Link>
        </div>

        {loading ? (
          <QuestionSetGridSkeleton />
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Failed to load question sets. Please try again.</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetch()}
                className="ml-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : questionSets.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <Music className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h2 className="text-xl font-semibold mb-2">No Question Sets Yet</h2>
              <p className="text-gray-600 mb-6">
                Create your first question set by selecting songs from Apple Music
              </p>
              <Link href="/browse">
                <Button>
                  <Music className="h-4 w-4 mr-2" />
                  Browse Music
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {questionSets.map((set) => (
              <Card key={set.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Artwork */}
                <div className="relative aspect-square w-full bg-gradient-to-br from-purple-500 to-pink-500">
                  {set.artwork_url ? (
                    <img 
                      src={set.artwork_url} 
                      alt={set.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="h-16 w-16 text-white/80" />
                    </div>
                  )}
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold">{set.name}</h3>
                    <Badge variant="outline" className={getDifficultyColor(set.difficulty)}>
                      {set.difficulty}
                    </Badge>
                  </div>
                
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{set.questions.length}</span> questions
                  </p>
                  {set.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {set.description}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">
                    Created {new Date(set.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handlePreview(set)}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Link href={`/questions/${set.id}/edit`}>
                    <Button size="sm" variant="outline" className="flex-1">
                      Edit
                    </Button>
                  </Link>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-red-600"
                    onClick={() => handleDelete(set.id)}
                    disabled={isDeleting === set.id}
                  >
                    {isDeleting === set.id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <PreviewModal
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false)
            setPreviewSet(null)
          }}
          questionSet={previewSet}
        />
      </div>
    </ProtectedRoute>
  )
}