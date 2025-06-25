import { AppError } from '@/lib/errors/types'

interface RetryOptions {
  maxAttempts?: number
  delay?: number
  backoff?: boolean
  retryIf?: (error: any) => boolean
  onRetry?: (error: any, attempt: number) => void
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = true,
    retryIf = (error) => {
      if (error instanceof AppError) {
        return error.isRetryable
      }
      return false
    },
    onRetry
  } = options

  let lastError: any

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Check if we should retry
      if (attempt === maxAttempts || !retryIf(error)) {
        throw error
      }

      // Call retry callback if provided
      if (onRetry) {
        onRetry(error, attempt)
      }

      // Calculate wait time
      const waitTime = backoff ? delay * attempt : delay
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  throw lastError
}

// Convenience function for retrying failed fetch requests
export async function retryFetch(
  url: string,
  options?: RequestInit,
  retryOptions?: RetryOptions
): Promise<Response> {
  return withRetry(
    async () => {
      const response = await fetch(url, options)
      if (!response.ok && response.status >= 500) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response
    },
    {
      ...retryOptions,
      retryIf: (error) => {
        // Retry on network errors or 5xx responses
        return error.message.includes('fetch') || error.message.includes('500')
      }
    }
  )
}