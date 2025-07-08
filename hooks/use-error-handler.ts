'use client'

import { useCallback, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { handleSupabaseError, isRLSError } from '@/utils/supabase/error-handler'

interface UseErrorHandlerOptions {
  fallbackMessage?: string
  showToast?: boolean
  onError?: (error: Error) => void
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { showToast = true, fallbackMessage, onError } = options
  const { toast } = useToast()
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleError = useCallback((error: unknown) => {
    console.error('Error caught by handler:', error)
    
    const handledError = handleSupabaseError(error)
    const errorObj = new Error(handledError.message)
    
    setError(errorObj)
    
    if (showToast) {
      // Show appropriate toast based on error type
      if (isRLSError(handledError)) {
        toast.error('Permission denied', {
          description: 'You do not have access to this resource.'
        })
      } else {
        toast.error(handledError.message || fallbackMessage || 'An error occurred')
      }
    }
    
    // Call custom error handler
    if (onError) {
      onError(errorObj)
    }
    
    return handledError
  }, [showToast, fallbackMessage, onError, toast])

  const executeAsync = useCallback(async <T,>(
    fn: () => Promise<T>
  ): Promise<T | null> => {
    try {
      setIsLoading(true)
      setError(null)
      const result = await fn()
      return result
    } catch (error) {
      handleError(error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [handleError])

  const execute = useCallback(<T,>(
    fn: () => T
  ): T | null => {
    try {
      setError(null)
      return fn()
    } catch (error) {
      handleError(error)
      return null
    }
  }, [handleError])

  const reset = useCallback(() => {
    setError(null)
  }, [])

  return {
    error,
    isLoading,
    handleError,
    executeAsync,
    execute,
    reset
  }
}