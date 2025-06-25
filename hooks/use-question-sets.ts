'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/auth-context'
import type { Database } from '@/lib/supabase/database.types'

type QuestionSet = Database['public']['Tables']['question_sets']['Row']
type Question = Database['public']['Tables']['questions']['Row']

export interface QuestionSetWithQuestions extends QuestionSet {
  questions: Question[]
}

export function useQuestionSets() {
  const { user } = useAuth()
  const [questionSets, setQuestionSets] = useState<QuestionSetWithQuestions[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClient()

  const fetchQuestionSets = useCallback(async () => {
    if (!user) {
      setQuestionSets([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('question_sets')
        .select(`
          *,
          questions (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setQuestionSets(data || [])
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching question sets:', err)
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    fetchQuestionSets()
  }, [fetchQuestionSets])

  const createQuestionSet = async (
    name: string,
    description: string | null,
    difficulty: 'easy' | 'medium' | 'hard',
    questions: Omit<Question, 'id' | 'question_set_id' | 'created_at' | 'updated_at'>[]
  ) => {
    try {
      setError(null)

      // Create question set
      const { data: questionSet, error: createError } = await supabase
        .from('question_sets')
        .insert({
          user_id: user!.id,
          name,
          description,
          difficulty,
          is_public: false
        })
        .select()
        .single()

      if (createError) throw createError

      // Create questions
      if (questions.length > 0) {
        const questionsToInsert = questions.map(q => ({
          ...q,
          question_set_id: questionSet.id
        }))

        const { error: questionsError } = await supabase
          .from('questions')
          .insert(questionsToInsert)

        if (questionsError) throw questionsError
      }

      // Refresh the list
      await fetchQuestionSets()

      return { data: questionSet, error: null }
    } catch (err) {
      const error = err as Error
      setError(error)
      return { data: null, error }
    }
  }

  const updateQuestionSet = async (
    id: string,
    updates: {
      name?: string
      description?: string | null
      difficulty?: 'easy' | 'medium' | 'hard'
      is_public?: boolean
    },
    questions?: Omit<Question, 'id' | 'question_set_id' | 'created_at' | 'updated_at'>[]
  ) => {
    try {
      setError(null)

      // Update question set
      const { error: updateError } = await supabase
        .from('question_sets')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user!.id)

      if (updateError) throw updateError

      // If questions provided, replace all questions
      if (questions) {
        // Delete existing questions
        const { error: deleteError } = await supabase
          .from('questions')
          .delete()
          .eq('question_set_id', id)

        if (deleteError) throw deleteError

        // Insert new questions
        if (questions.length > 0) {
          const questionsToInsert = questions.map(q => ({
            ...q,
            question_set_id: id
          }))

          const { error: insertError } = await supabase
            .from('questions')
            .insert(questionsToInsert)

          if (insertError) throw insertError
        }
      }

      // Refresh the list
      await fetchQuestionSets()

      return { error: null }
    } catch (err) {
      const error = err as Error
      setError(error)
      return { error }
    }
  }

  const deleteQuestionSet = async (id: string) => {
    try {
      setError(null)

      const { error } = await supabase
        .from('question_sets')
        .delete()
        .eq('id', id)
        .eq('user_id', user!.id)

      if (error) throw error

      // Refresh the list
      await fetchQuestionSets()

      return { error: null }
    } catch (err) {
      const error = err as Error
      setError(error)
      return { error }
    }
  }

  return {
    questionSets,
    loading,
    error,
    createQuestionSet,
    updateQuestionSet,
    deleteQuestionSet,
    refetch: fetchQuestionSets
  }
}