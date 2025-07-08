// ABOUTME: Browse page for discovering public question sets
// ABOUTME: Allows searching, filtering, and favoriting community question sets
'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, 
  Filter, 
  Heart, 
  Play, 
  Copy, 
  User,
  TrendingUp,
  Clock,
  Music,
  SortAsc
} from 'lucide-react'
import { usePublicQuestionSets, type SortOption, type DifficultyFilter } from '@/hooks/use-public-question-sets'
import { QuestionSetGridSkeleton } from '@/components/loading/question-set-skeleton'
import { useToast } from '@/hooks/use-toast'
import { errorHandler } from '@/lib/errors/handler'
import { useAuth } from '@/contexts/auth-context'
import { PublicPreviewModal } from '@/components/questions/public-preview-modal'
import { useRouter } from 'next/navigation'
import type { Question } from '@/types'

export default function BrowsePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [previewSet, setPreviewSet] = useState<any>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  
  const { 
    questionSets, 
    loading, 
    error, 
    hasMore, 
    loadMore, 
    toggleFavorite,
    refetch 
  } = usePublicQuestionSets({
    searchTerm,
    difficulty,
    sortBy,
    onlyFavorites
  })

  // Debug: Log when the page renders and what data is received
  console.log('[BrowsePage] Rendered. usePublicQuestionSets:', {
    questionSets,
    loading,
    error,
    hasMore,
    searchTerm,
    difficulty,
    sortBy,
    onlyFavorites
  })

  const handleToggleFavorite = async (e: React.MouseEvent, questionSetId: string) => {
    e.stopPropagation()
    
    if (!user) {
      toast.error('Please log in to favorite question sets')
      return
    }

    const { error } = await toggleFavorite(questionSetId)
    if (error) {
      const appError = errorHandler.handle(error)
      toast.error(errorHandler.getErrorMessage(appError))
    }
  }

  const handlePreview = (set: any) => {
    // Transform to match expected format
    const transformedSet = {
      id: set.id,
      name: set.name,
      description: set.description,
      difficulty: set.difficulty,
      questionCount: set.question_count,
      playCount: set.play_count || 0,
      createdAt: set.created_at,
      questions: [] // Will be loaded in preview modal
    }
    setPreviewSet(transformedSet)
    setIsPreviewOpen(true)
  }

  const handleFork = async (e: React.MouseEvent, set: any) => {
    e.stopPropagation()
    
    if (!user) {
      toast.error('Please log in to fork question sets')
      return
    }

    // Store the set info and redirect to create page
    sessionStorage.setItem('forkFromSet', JSON.stringify({
      id: set.id,
      name: set.name,
      description: set.description
    }))
    
    router.push('/questions/new?fork=true')
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 border-green-600'
      case 'medium': return 'text-yellow-600 border-yellow-600'
      case 'hard': return 'text-red-600 border-red-600'
      default: return ''
    }
  }

  const getSortIcon = (sort: SortOption) => {
    switch (sort) {
      case 'popular': return <TrendingUp className="h-4 w-4" />
      case 'newest': return <Clock className="h-4 w-4" />
      case 'alphabetical': return <SortAsc className="h-4 w-4" />
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Browse Question Sets</h1>
        <p className="mt-2 text-gray-600">
          Discover and play community-created question sets
        </p>
      </div>

      {/* Filters and Search */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search question sets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={difficulty} onValueChange={(v) => setDifficulty(v as DifficultyFilter)}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-40">
              {getSortIcon(sortBy)}
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="alphabetical">A-Z</SelectItem>
            </SelectContent>
          </Select>

          {user && (
            <Button
              variant={onlyFavorites ? "default" : "outline"}
              onClick={() => setOnlyFavorites(!onlyFavorites)}
            >
              <Heart className={`h-4 w-4 mr-2 ${onlyFavorites ? 'fill-current' : ''}`} />
              Favorites
            </Button>
          )}
        </div>
      </Card>

      {/* Results */}
      {loading && questionSets.length === 0 ? (
        <QuestionSetGridSkeleton />
      ) : error ? (
        <Card className="p-12">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load question sets</p>
            <Button onClick={refetch}>Try Again</Button>
            {/* Debug: Show error details */}
            <pre className="mt-4 text-xs text-red-400 bg-red-50 p-2 rounded">{error?.message || String(error)}</pre>
          </div>
        </Card>
      ) : questionSets.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Music className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="mb-2">No public question sets found.</p>
            {/* Debug: Show current filters and state */}
            <pre className="mt-4 text-xs text-gray-400 bg-gray-50 p-2 rounded">{JSON.stringify({ searchTerm, difficulty, sortBy, onlyFavorites }, null, 2)}</pre>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {questionSets.map((set) => (
              <Card 
                key={set.id} 
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handlePreview(set)}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold line-clamp-2">{set.name}</h3>
                  <Badge variant="outline" className={getDifficultyColor(set.difficulty)}>
                    {set.difficulty}
                  </Badge>
                </div>
                
                {set.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {set.description}
                  </p>
                )}
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    <span>{set.user?.display_name || set.user?.email || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{set.question_count || 0} questions</span>
                    <span>{set.play_count || 0} plays</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePreview(set)
                    }}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  
                  {user && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => handleToggleFavorite(e, set.id)}
                      >
                        <Heart 
                          className={`h-4 w-4 ${set.is_favorited ? 'fill-current text-red-500' : ''}`} 
                        />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => handleFork(e, set)}
                        title="Fork this question set"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="mt-8 text-center">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Preview Modal */}
      <PublicPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false)
          setPreviewSet(null)
        }}
        questionSet={previewSet}
      />
    </div>
  )
}