'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from './use-user'
import type { Tables } from '@/lib/supabase/database.types'

type QuestionSet = Tables<'question_sets'>

export function useQuestionSets() {
  const { user } = useUser()
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!user) {
      setQuestionSets([])
      setLoading(false)
      return
    }

    const fetchQuestionSets = async () => {
      try {
        const { data, error } = await supabase
          .from('question_sets')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setQuestionSets(data || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchQuestionSets()

    // Subscribe to changes
    const subscription = supabase
      .channel('question-sets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'question_sets',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchQuestionSets()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user, supabase])

  return { questionSets, loading, error }
}