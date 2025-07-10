'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
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
      console.log('[useQuestionSetDetails] Fetching questions for:', questionSetId)
      const supabase = createClient()
      
      try {
        setLoading(true)
        setError(null)

        // Add timeout to detect hanging requests
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        )

        const queryPromise = supabase
          .from('questions')
          .select('*')
          .eq('question_set_id', questionSetId)
          .order('order_index', { ascending: true })

        console.log('[useQuestionSetDetails] Query started...')

        const { data, error } = await Promise.race([
          queryPromise,
          timeoutPromise
        ]) as any

        console.log('[useQuestionSetDetails] Response:', { data, error })

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