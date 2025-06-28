'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type QuestionSet = Database['public']['Tables']['question_sets']['Row']
type Question = Database['public']['Tables']['questions']['Row']

export function useQuestionSetDetails(questionSetId: string | null) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!questionSetId) {
      setQuestions([])
      return
    }

    const fetchQuestions = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('question_set_id', questionSetId)
          .order('order_index', { ascending: true })

        if (error) throw error

        setQuestions(data || [])
      } catch (err) {
        setError(err as Error)
        console.error('Error fetching questions:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchQuestions()
  }, [questionSetId, supabase])

  return { questions, loading, error }
}