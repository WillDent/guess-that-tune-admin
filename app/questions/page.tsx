import { Suspense } from 'react'
import { requireAuth } from '@/lib/auth/server'
import { createServerClient } from '@/lib/supabase/server'
import { QuestionsContent } from './questions-content'
import { QuestionSetGridSkeleton } from '@/components/loading/question-set-skeleton'
import type { Database } from '@/lib/supabase/database.types'

type QuestionSet = Database['public']['Tables']['question_sets']['Row']
type Question = Database['public']['Tables']['questions']['Row']

export interface QuestionSetWithQuestions extends QuestionSet {
  questions: Question[]
  question_set_categories?: {
    category: {
      id: string
      name: string
      color: string
      icon: string
    }
  }[]
}

async function getUserQuestionSets(userId: string) {
  const supabase = await createServerClient()
  
  const { data, error } = await supabase
    .from('question_sets')
    .select(`
      *,
      questions (*),
      question_set_categories (
        category:categories (
          id,
          name,
          color,
          icon
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch question sets:', error)
    return []
  }

  return (data || []) as QuestionSetWithQuestions[]
}

export default async function QuestionsPage() {
  const user = await requireAuth()
  const questionSets = await getUserQuestionSets(user.id)

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Question Sets</h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
          Manage your question collections for games
        </p>
      </div>

      <Suspense fallback={<QuestionSetGridSkeleton />}>
        <QuestionsContent 
          initialQuestionSets={questionSets}
          userId={user.id}
        />
      </Suspense>
    </div>
  )
}