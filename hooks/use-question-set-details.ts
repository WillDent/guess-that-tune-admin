'use client'

import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import { withSupabaseRetry } from '@/lib/supabase/retry-wrapper'
import type { Database } from '@/lib/supabase/database.types'

type QuestionSet = Database['public']['Tables']['question_sets']['Row']
type Question = Database['public']['Tables']['questions']['Row']

export function useQuestionSetDetails(questionSetId: string | null) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!questionSetId) {
      setQuestions([])
      return
    }

    const fetchQuestions = async () => {
      const supabase = createSupabaseBrowserClient()
      
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await withSupabaseRetry(
          () => supabase
            .from('questions')
            .select('*')
            .eq('question_set_id', questionSetId)
            .order('order_index', { ascending: true }),
          {
            maxRetries: 3,
            onRetry: (attempt, error) => {
              console.warn(`[useQuestionSetDetails] Retry attempt ${attempt} after error:`, error.message)
            }
          }
        )

        if (error) throw error

        setQuestions(data || [])
      } catch (err) {
        setError(err as Error)
        console.error('[useQuestionSetDetails] Error fetching questions:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [questionSetId])

  return { questions, loading, error }
}