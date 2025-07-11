'use client'

import { useEffect, useState, useCallback } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import { useAuth } from '@/contexts/auth-context'
import type { Database } from '@/lib/supabase/database.types'

type QuestionSet = Database['public']['Tables']['question_sets']['Row']
type Question = Database['public']['Tables']['questions']['Row']

export interface QuestionSetWithQuestions extends QuestionSet {
  questions: Question[]
}

export function useQuestionSets() {
  const { user } = useAuth()
  const [supabaseClient] = useState(() => createSupabaseBrowserClient())
  const [questionSets, setQuestionSets] = useState<QuestionSetWithQuestions[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchQuestionSets = useCallback(async () => {
    if (!user) {
      setQuestionSets([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabaseClient
        .from('question_sets')
        .select(`
          *,
          questions (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[USE-QUESTION-SETS] Fetch error:', error)
        throw error
      }

      setQuestionSets(data || [])
    } catch (err) {
      setError(err as Error)
      console.error('[USE-QUESTION-SETS] Error fetching question sets:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id, supabaseClient])

  useEffect(() => {
    fetchQuestionSets()
  }, [fetchQuestionSets])

  const createQuestionSet = async (
    name: string,
    description: string | null,
    difficulty: 'easy' | 'medium' | 'hard',
    questions: Omit<Question, 'id' | 'question_set_id' | 'created_at' | 'updated_at'>[],
    isPublic: boolean = false,
    tags: string[] = []
  ) => {
    
    try {
      setError(null)

      if (!user) {
        console.error('[USE-QUESTION-SETS] No user found!')
        throw new Error('User not authenticated')
      }

      
      // Create question set
      const { data: questionSet, error: createError } = await supabaseClient
        .from('question_sets')
        .insert({
          user_id: user!.id,
          name,
          description,
          difficulty,
          is_public: isPublic,
          tags: tags.length > 0 ? tags : null
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


        const { error: questionsError } = await supabaseClient
          .from('questions')
          .insert(questionsToInsert)


        if (questionsError) throw questionsError
      }

      // Refresh the list
      await fetchQuestionSets()

      return { data: questionSet, error: null }
    } catch (err) {
      const error = err as Error
      console.error('[USE-QUESTION-SETS] createQuestionSet error:', error)
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
      tags?: string[] | null
      artwork_url?: string | null
    },
    questions?: Omit<Question, 'id' | 'question_set_id' | 'created_at' | 'updated_at'>[]
  ) => {
    try {
      setError(null)

      // Update question set
      const { error: updateError } = await supabaseClient
        .from('question_sets')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user!.id)

      if (updateError) throw updateError

      // If questions provided, replace all questions
      if (questions) {
        // Delete existing questions
        const { error: deleteError } = await supabaseClient
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

          const { error: insertError } = await supabaseClient
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

      const { error } = await supabaseClient
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