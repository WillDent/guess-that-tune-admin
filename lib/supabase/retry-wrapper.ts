/**
 * Retry wrapper for handling transient failures
 */

export interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffFactor?: number
  onRetry?: (attempt: number, error: any) => void
  shouldRetry?: (error: any) => boolean
}

/**
 * Default function to determine if an error is retryable
 */
function isRetryableError(error: any): boolean {
  // Network errors
  if (error.message?.includes('fetch failed')) return true
  if (error.message?.includes('Network request failed')) return true
  if (error.message?.includes('ECONNREFUSED')) return true
  if (error.message?.includes('ETIMEDOUT')) return true
  
  // Supabase specific errors
  if (error.code === 'PGRST301') return true // Database connection error
  if (error.code === '53300') return true // Too many connections
  if (error.code === '57P03') return true // Cannot connect now
  
  // HTTP status codes that are retryable
  if (error.status === 429) return true // Too many requests
  if (error.status === 502) return true // Bad gateway
  if (error.status === 503) return true // Service unavailable
  if (error.status === 504) return true // Gateway timeout
  
  return false
}

/**
 * Retry wrapper with exponential backoff
 * @param operation - The async operation to retry
 * @param options - Retry configuration options
 * @returns Promise that resolves with the operation result or rejects with the last error
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    onRetry,
    shouldRetry = isRetryableError
  } = options

  let lastError: any

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Attempt the operation
      return await operation()
    } catch (error) {
      lastError = error
      
      // Check if we should retry
      if (!shouldRetry(error)) {
        throw error
      }
      
      // Check if this was the last attempt
      if (attempt >= maxRetries - 1) {
        throw error
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(backoffFactor, attempt),
        maxDelay
      )
      
      // Call onRetry callback if provided
      onRetry?.(attempt + 1, error)
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

/**
 * Retry wrapper specifically for Supabase operations
 */
export async function withSupabaseRetry<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  options: RetryOptions = {}
): Promise<{ data: T | null; error: any }> {
  const supabaseOptions: RetryOptions = {
    ...options,
    shouldRetry: (error) => {
      // Check if it's a Supabase response with an error
      if (error && typeof error === 'object' && 'error' in error) {
        return isRetryableError(error.error)
      }
      return isRetryableError(error)
    }
  }
  
  try {
    const result = await withRetry(async () => {
      const response = await operation()
      
      // If there's an error in the response, check if it's retryable
      if (response.error && supabaseOptions.shouldRetry!(response.error)) {
        throw response.error
      }
      
      return response
    }, supabaseOptions)
    
    return result
  } catch (error) {
    // Return in Supabase format
    return { data: null, error }
  }
}