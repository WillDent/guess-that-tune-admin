'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { withSession } from '@/utils/supabase/with-session'
import { handleSupabaseError, isRLSError, isDuplicateError } from '@/utils/supabase/error-handler'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

/**
 * Example component demonstrating proper Supabase error handling
 */
export function ErrorHandlingExample() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handleCreateGame = async () => {
    setLoading(true)
    
    try {
      // Use withSession to ensure we have a valid session
      const result = await withSession(supabase, async (session) => {
        const { data, error } = await supabase
          .from('games')
          .insert({
            name: 'Test Game',
            host_user_id: session.user.id,
            question_set_id: 'some-id',
            status: 'waiting'
          })
          .select()
          .single()

        if (error) throw error
        return data
      })

      if (!result) {
        toast.error('Please log in to create a game')
        return
      }

      toast.success('Game created successfully!')
    } catch (err) {
      // Handle the error with our standardized handler
      const handledError = handleSupabaseError(err)
      
      // Show appropriate message based on error type
      if (isRLSError(handledError)) {
        toast.error('You do not have permission to create games')
      } else if (isDuplicateError(handledError)) {
        toast.error('A game with this name already exists')
      } else {
        toast.error(handledError.message)
      }
      
      // Log for debugging
      console.error('Game creation error:', handledError)
    } finally {
      setLoading(false)
    }
  }

  const handleFetchProfile = async () => {
    setLoading(true)
    
    try {
      const result = await withSession(supabase, async (session) => {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (error) throw error
        return data
      })

      if (!result) {
        toast.error('Please log in to view your profile')
        return
      }

      toast.success(`Hello, ${result.email}!`)
    } catch (err) {
      const handledError = handleSupabaseError(err)
      toast.error(handledError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-lg font-semibold">Error Handling Examples</h2>
      
      <div className="space-y-2">
        <Button 
          onClick={handleCreateGame}
          disabled={loading}
        >
          Create Game (May fail with RLS)
        </Button>
        
        <Button 
          onClick={handleFetchProfile}
          disabled={loading}
          variant="outline"
        >
          Fetch Profile (Requires auth)
        </Button>
      </div>
      
      <div className="text-sm text-gray-600">
        <p>These examples demonstrate:</p>
        <ul className="list-disc list-inside mt-2">
          <li>Pre-flight session checks with withSession</li>
          <li>Standardized error handling</li>
          <li>User-friendly error messages</li>
          <li>Type-specific error handling (RLS, duplicate, etc.)</li>
        </ul>
      </div>
    </div>
  )
}