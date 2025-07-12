// ABOUTME: Browse page for discovering public question sets
// ABOUTME: Server component that fetches initial data
import { Suspense } from 'react'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/utils/supabase/auth'
import { BrowseContent } from './browse-content'
import { QuestionSetGridSkeleton } from '@/components/loading/question-set-skeleton'
import type { Database } from '@/lib/supabase/database.types'
import type { PublicQuestionSet, SortOption, DifficultyFilter } from './types'

interface PageProps {
  searchParams: Promise<{
    search?: string
    difficulty?: DifficultyFilter
    sort?: SortOption
    favorites?: string
  }>
}

async function getQuestionSets(searchParams: Awaited<PageProps['searchParams']>) {
  const supabase = await createServerClient()
  
  let query = supabase
    .from('question_sets')
    .select(`
      *,
      user:users!question_sets_user_id_fkey (
        id,
        display_name,
        email
      ),
      questions (count)
    `)
    .eq('is_public', true)
    .limit(24)

  // Apply difficulty filter
  if (searchParams.difficulty && searchParams.difficulty !== 'all') {
    query = query.eq('difficulty', searchParams.difficulty)
  }

  // Apply search if term exists
  if (searchParams.search) {
    query = query.or(`name.ilike.%${searchParams.search}%,description.ilike.%${searchParams.search}%`)
  }

  // Apply sorting
  switch (searchParams.sort) {
    case 'popular':
      query = query.order('play_count', { ascending: false })
      break
    case 'alphabetical':
      query = query.order('name', { ascending: true })
      break
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false })
      break
  }

  const { data, error } = await query

  if (error) {
    console.error('Failed to fetch question sets:', error)
    return []
  }

  // Transform the data to include question count
  return (data || []).map((set: any) => ({
    ...set,
    user: set.user as Pick<Database['public']['Tables']['users']['Row'], 'id' | 'display_name' | 'email'>,
    question_count: Array.isArray(set.questions) ? set.questions.length : (set.questions as any)?.count || 0
  })) as PublicQuestionSet[]
}

async function getUserFavorites() {
  const supabase = await createServerClient()
  const user = await getCurrentUser(supabase)
  
  if (!user) return []

  const { data, error } = await supabase
    .from('favorites')
    .select('question_set_id')
    .eq('user_id', user.id)
  
  if (error) {
    console.error('Failed to fetch favorites:', error)
    return []
  }
  
  return (data || []).map((f: { question_set_id: string }) => f.question_set_id)
}

export default async function BrowsePage({ searchParams }: PageProps) {
  // Await searchParams as required by Next.js 15
  const params = await searchParams

  // Fetch data in parallel
  const [questionSets, favorites] = await Promise.all([
    getQuestionSets(params),
    getUserFavorites()
  ])

  // Add favorited status to question sets
  const setsWithFavorites = questionSets.map(set => ({
    ...set,
    is_favorited: favorites.includes(set.id)
  }))

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Browse Question Sets</h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
          Discover and play community-created question sets
        </p>
      </div>

      <Suspense fallback={<QuestionSetGridSkeleton />}>
        <BrowseContent 
          initialQuestionSets={setsWithFavorites}
          initialFavorites={favorites}
          searchParams={params}
        />
      </Suspense>
    </div>
  )
}