'use client'

import { useEffect, useState, useCallback } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import { useAuth } from '@/contexts/auth-context'
import { withRetry, withSupabaseRetry } from '@/lib/supabase/retry-wrapper'
import { checkSupabaseHealth, quickHealthCheck } from '@/lib/supabase/health-check'
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

      // Try SDK first with a timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('SDK timeout')), 5000)
      )

      try {
        const dataPromise = supabaseClient
          .from('question_sets')
          .select(`
            *,
            questions (*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        const result = await Promise.race([dataPromise, timeoutPromise])
        const { data, error } = result as any

        if (error) throw error

        setQuestionSets(data || [])
      } catch (sdkError) {
        // Fallback to direct REST API if SDK hangs
        console.log('[USE-QUESTION-SETS] SDK timeout or error, falling back to REST API')
        
        // Get session token
        const response = await fetch('/api/auth/session')
        if (!response.ok) {
          throw new Error('Failed to get session')
        }
        
        const { token } = await response.json()
        
        // Fetch question sets directly
        const questionSetsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/question_sets?user_id=eq.${user.id}&order=created_at.desc&select=*`,
          {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          }
        )
        
        if (!questionSetsResponse.ok) {
          throw new Error('Failed to fetch question sets')
        }
        
        const questionSetsData = await questionSetsResponse.json()
        
        // For each question set, fetch its questions
        const questionSetsWithQuestions = await Promise.all(
          questionSetsData.map(async (qs: any) => {
            const questionsResponse = await fetch(
              `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/questions?question_set_id=eq.${qs.id}&order=order_index.asc`,
              {
                headers: {
                  'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                }
              }
            )
            
            const questions = questionsResponse.ok ? await questionsResponse.json() : []
            
            return {
              ...qs,
              questions
            }
          })
        )
        
        setQuestionSets(questionSetsWithQuestions)
      }
    } catch (err) {
      setError(err as Error)
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
    tags: string[] = [],
    gameType: string = 'guess_artist'
  ) => {
    console.log('[USE-QUESTION-SETS] createQuestionSet called with:', { name, difficulty, questionsCount: questions.length })
    try {
      setError(null)

      if (!user) {
        console.error('[USE-QUESTION-SETS] No user found')
        throw new Error('User not authenticated')
      }
      
      console.log('[USE-QUESTION-SETS] User authenticated:', user.id)
      
      // Skip health check since SDK is hanging - we'll use direct REST calls
      console.log('[USE-QUESTION-SETS] Skipping health check due to SDK issues')
      
      // Create question set using direct REST client with proper authentication
      console.log('[USE-QUESTION-SETS] Getting user session for authenticated request')
      
      // Get session token using API endpoint to bypass SDK hanging
      let accessToken = null
      
      try {
        console.log('[USE-QUESTION-SETS] Getting session token via API')
        const response = await fetch('/api/auth/session')
        
        if (!response.ok) {
          const error = await response.json()
          console.error('[USE-QUESTION-SETS] API failed:', error)
          throw new Error(error.error || 'Failed to get session')
        }
        
        const { token } = await response.json()
        if (!token) {
          throw new Error('No session token received')
        }
        
        accessToken = token
        console.log('[USE-QUESTION-SETS] Got session token from API')
      } catch (err) {
        console.error('[USE-QUESTION-SETS] Failed to get session:', err)
        throw new Error('Unable to authenticate. Please try logging in again.')
      }
      
      const questionSetData = {
        user_id: user!.id,
        name,
        description,
        difficulty,
        is_public: isPublic,
        tags: tags.length > 0 ? tags : null,
        game_type: gameType
      }
      
      console.log('[USE-QUESTION-SETS] Making authenticated request to create question set')
      
      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      let questionSet = null
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/question_sets`, {
          method: 'POST',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(questionSetData),
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Failed to create question set: ${response.status} ${errorText}`)
        }
        
        const questionSetArray = await response.json()
        questionSet = questionSetArray[0]
        
        if (!questionSet) {
          throw new Error('Question set creation returned no data')
        }
        
        console.log('[USE-QUESTION-SETS] Question set created successfully:', questionSet.id)
      } catch (err) {
        clearTimeout(timeoutId)
        if (err instanceof Error && err.name === 'AbortError') {
          throw new Error('Question set creation timed out after 10 seconds')
        }
        throw err
      }

      // Create questions using authenticated direct REST client
      if (questions.length > 0 && questionSet) {
        console.log('[USE-QUESTION-SETS] Creating questions with authenticated direct REST client')
        const questionsToInsert = questions.map(q => ({
          ...q,
          question_set_id: questionSet.id
        }))

        // Create abort controller for questions request
        const questionsController = new AbortController()
        const questionsTimeoutId = setTimeout(() => questionsController.abort(), 10000)

        try {
          const questionsResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/questions`, {
            method: 'POST',
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify(questionsToInsert),
            signal: questionsController.signal
          })

          clearTimeout(questionsTimeoutId)

          if (!questionsResponse.ok) {
            const errorText = await questionsResponse.text()
            throw new Error(`Failed to create questions: ${questionsResponse.status} ${errorText}`)
          }
          
          console.log('[USE-QUESTION-SETS] Questions created successfully')
        } catch (err) {
          clearTimeout(questionsTimeoutId)
          if (err instanceof Error && err.name === 'AbortError') {
            throw new Error('Questions creation timed out after 10 seconds')
          }
          throw err
        }
      }

      // Skip refreshing the list since SDK might hang
      // The list will refresh when user navigates to /questions page
      console.log('[USE-QUESTION-SETS] Skipping fetchQuestionSets to avoid SDK hang')

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
      tags?: string[] | null
      artwork_url?: string | null
      state?: 'NEW' | 'PUBLISHED'
      game_type?: string
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