import { Suspense } from 'react'
import { QuestionSetGrid } from '@/components/question-sets/question-set-grid'
import { QuestionSetSkeleton } from '@/components/question-sets/question-set-skeleton'
import { createServerClient } from '@/lib/supabase/server'
import { QUERY_OPTIONS } from '@/lib/supabase/config'

// This component loads immediately
function PageHeader() {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold">Explore Question Sets</h1>
      <p className="text-muted-foreground mt-2">
        Discover amazing question sets created by our community
      </p>
    </div>
  )
}

// This component streams in when data is ready
async function QuestionSets() {
  const supabase = await createServerClient()
  
  // This query will stream when ready
  const { data: questionSets, error } = await supabase
    .from('question_sets')
    .select(`
      *,
      user:users!created_by(name, avatar_url),
      questions(count),
      favorites(count)
    `)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(20)
    .throwOnError()
  
  if (error) {
    throw error
  }
  
  return <QuestionSetGrid questionSets={questionSets} />
}

// This component loads popular sets in parallel
async function PopularSets() {
  const supabase = await createServerClient()
  
  const { data: popularSets } = await supabase
    .from('question_sets')
    .select(`
      *,
      user:users!created_by(name, avatar_url),
      questions(count),
      favorites(count)
    `)
    .eq('is_public', true)
    .order('favorites_count', { ascending: false })
    .limit(6)
    .throwOnError()
  
  if (!popularSets || popularSets.length === 0) {
    return null
  }
  
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-semibold mb-4">Popular This Week</h2>
      <QuestionSetGrid questionSets={popularSets} />
    </section>
  )
}

// Categories load independently
async function Categories() {
  const supabase = await createServerClient()
  
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .is('parent_id', null)
    .order('name')
  
  return (
    <aside className="w-64">
      <h3 className="font-semibold mb-4">Categories</h3>
      <nav className="space-y-2">
        {categories?.map((category: any) => (
          <a
            key={category.id}
            href={`/explore?category=${category.id}`}
            className="block px-3 py-2 rounded-md hover:bg-accent"
          >
            {category.name}
          </a>
        ))}
      </nav>
    </aside>
  )
}

// Main page component with streaming
export default function ExplorePage() {
  return (
    <div className="container mx-auto py-8">
      {/* Header loads immediately */}
      <PageHeader />
      
      <div className="flex gap-8">
        {/* Categories stream in independently */}
        <Suspense fallback={<div className="w-64 h-96 bg-muted animate-pulse rounded-lg" />}>
          <Categories />
        </Suspense>
        
        <div className="flex-1">
          {/* Popular sets stream in first */}
          <Suspense fallback={<QuestionSetSkeleton count={6} />}>
            <PopularSets />
          </Suspense>
          
          {/* All sets stream in independently */}
          <Suspense fallback={<QuestionSetSkeleton count={20} />}>
            <QuestionSets />
          </Suspense>
        </div>
      </div>
    </div>
  )
}