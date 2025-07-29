// ABOUTME: Client component for browse page interactivity
// ABOUTME: Handles search, filtering, and favoriting while server component handles initial data
'use client'

import { useState, useTransition } from 'react'
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
import { useToast } from '@/hooks/use-toast'
import { errorHandler } from '@/lib/errors/handler'
import { useAuth } from '@/contexts/auth-context'
import { PublicPreviewModal } from '@/components/questions/public-preview-modal'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { PublicQuestionSet, SortOption, DifficultyFilter } from './types'
import { GAME_TYPES, gameTypeLabels } from '@/types/game-type'

interface BrowseContentProps {
  initialQuestionSets: PublicQuestionSet[]
  initialFavorites: string[]
  searchParams: {
    search?: string
    difficulty?: DifficultyFilter
    sort?: SortOption
    favorites?: string
  }
}

export function BrowseContent({ 
  initialQuestionSets, 
  initialFavorites,
  searchParams 
}: BrowseContentProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [questionSets, setQuestionSets] = useState(initialQuestionSets)
  const [favorites, setFavorites] = useState(new Set(initialFavorites))
  const [previewSet, setPreviewSet] = useState<any>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  
  // Parse URL params
  const searchTerm = searchParams.search || ''
  const difficulty = (searchParams.difficulty || 'all') as DifficultyFilter
  const sortBy = (searchParams.sort || 'newest') as SortOption
  const onlyFavorites = searchParams.favorites === 'true'

  const handleFilterChange = (updates: Partial<typeof searchParams>) => {
    const params = new URLSearchParams()
    
    // Preserve existing params and apply updates
    const newParams = { ...searchParams, ...updates }
    
    if (newParams.search) params.set('search', newParams.search)
    if (newParams.difficulty && newParams.difficulty !== 'all') params.set('difficulty', newParams.difficulty)
    if (newParams.sort && newParams.sort !== 'newest') params.set('sort', newParams.sort)
    if (newParams.favorites === 'true') params.set('favorites', 'true')
    
    // Use startTransition for smoother updates
    startTransition(() => {
      router.push(`/browse?${params.toString()}`)
    })
  }

  const handleToggleFavorite = async (e: React.MouseEvent, questionSetId: string) => {
    e.stopPropagation()
    
    if (!user) {
      toast.error('Please log in to favorite question sets')
      return
    }

    const supabase = createClient()
    const isFavorited = favorites.has(questionSetId)

    try {
      if (isFavorited) {
        // Remove favorite
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('question_set_id', questionSetId)

        if (error) throw error
        
        setFavorites(prev => {
          const next = new Set(prev)
          next.delete(questionSetId)
          return next
        })
      } else {
        // Add favorite
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            question_set_id: questionSetId
          })

        if (error) throw error
        
        setFavorites(prev => new Set([...prev, questionSetId]))
      }

      // Update local state
      setQuestionSets(prev => 
        prev.map(set => 
          set.id === questionSetId 
            ? { ...set, is_favorited: !isFavorited }
            : set
        )
      )
    } catch (err) {
      const appError = errorHandler.handle(err)
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
      artwork_url: set.artwork_url,
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

  // Filter displayed sets
  const displayedSets = questionSets.filter(set => {
    if (onlyFavorites && !favorites.has(set.id)) return false
    return true
  })

  return (
    <>
      {/* Filters and Search */}
      <Card className="p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search question sets..."
                defaultValue={searchTerm}
                onChange={(e) => {
                  const value = e.target.value
                  // Debounce search
                  const timeoutId = setTimeout(() => {
                    handleFilterChange({ search: value })
                  }, 300)
                  return () => clearTimeout(timeoutId)
                }}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select 
              value={difficulty} 
              onValueChange={(v) => handleFilterChange({ difficulty: v as DifficultyFilter })}
              disabled={isPending}
            >
              <SelectTrigger className="flex-1 sm:w-40">
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

            <Select 
              value={sortBy} 
              onValueChange={(v) => handleFilterChange({ sort: v as SortOption })}
              disabled={isPending}
            >
              <SelectTrigger className="flex-1 sm:w-40">
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
                onClick={() => handleFilterChange({ favorites: onlyFavorites ? undefined : 'true' })}
                disabled={isPending}
                className="sm:w-auto"
              >
                <Heart className={`h-4 w-4 sm:mr-2 ${onlyFavorites ? 'fill-current' : ''}`} />
                <span className="hidden sm:inline">Favorites</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Results */}
      {isPending ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </Card>
          ))}
        </div>
      ) : displayedSets.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Music className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="mb-2">No question sets found.</p>
            {onlyFavorites && (
              <p className="text-sm text-gray-600">Try removing the favorites filter.</p>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {displayedSets.map((set) => (
            <Card 
              key={set.id} 
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handlePreview(set)}
            >
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
              
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-semibold line-clamp-2">{set.name}</h3>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      {gameTypeLabels[set.game_type || GAME_TYPES.GUESS_ARTIST]}
                    </Badge>
                    <Badge variant="outline" className={getDifficultyColor(set.difficulty)}>
                      {set.difficulty}
                    </Badge>
                  </div>
                </div>
              
              {set.description && (
                <p className="text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-2">
                  {set.description}
                </p>
              )}
              
              <div className="space-y-2 mb-3 sm:mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-2" />
                  <span>{set.user?.display_name || set.user?.email || 'Unknown'}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{set.question_count || 0} questions</span>
                  <span>{set.play_count || 0} plays</span>
                </div>
              </div>

              <div className="flex gap-1 sm:gap-2">
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
                        className={`h-4 w-4 ${favorites.has(set.id) ? 'fill-current text-red-500' : ''}`} 
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
              </div>
            </Card>
          ))}
        </div>
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
    </>
  )
}