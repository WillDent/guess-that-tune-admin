// ABOUTME: Questions page showing all created question sets
// ABOUTME: Server component that fetches user's question sets
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { requireAuth } from '@/utils/supabase/auth'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { QuestionsContent } from './questions-content'
import { QuestionSetGridSkeleton } from '@/components/loading/question-set-skeleton'
import type { Database } from '@/lib/supabase/database.types'

type QuestionSet = Database['public']['Tables']['question_sets']['Row']
type Question = Database['public']['Tables']['questions']['Row']

export interface QuestionSetWithQuestions extends QuestionSet {
  questions: Question[]
}

async function getUserQuestionSets(userId: string) {
  const supabase = await createServerClient()
  
  const { data, error } = await supabase
    .from('question_sets')
    .select(`
      *,
      questions (*)
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
  const supabase = await createServerClient()
  const user = await requireAuth(supabase)
  
  if (!user) {
    redirect('/login')
  }

  const questionSets = await getUserQuestionSets(user.id)

  return (
    <ProtectedRoute>
      <div>
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Question Sets</h1>
            <p className="mt-2 text-gray-600">
              Manage your question collections for games
            </p>
          </div>
        </div>

        <Suspense fallback={<QuestionSetGridSkeleton />}>
          <QuestionsContent 
            initialQuestionSets={questionSets}
            userId={user.id}
          />
        </Suspense>
      </div>
    </ProtectedRoute>
  )
}