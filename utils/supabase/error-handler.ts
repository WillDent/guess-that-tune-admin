import { PostgrestError } from '@supabase/supabase-js'

export type ErrorType = 
  | 'rls_violation'
  | 'duplicate'
  | 'not_found'
  | 'validation'
  | 'network'
  | 'unknown'

export interface HandledError {
  type: ErrorType
  message: string
  originalError?: any
}

/**
 * Maps Supabase/PostgreSQL error codes to user-friendly messages
 */
const ERROR_MESSAGES: Record<string, { type: ErrorType; message: string }> = {
  // RLS violations
  'PGRST116': { type: 'rls_violation', message: 'Access denied. You do not have permission to view this resource.' },
  '42501': { type: 'rls_violation', message: 'Insufficient permissions to perform this action.' },
  
  // Duplicate key violations
  '23505': { type: 'duplicate', message: 'This item already exists.' },
  
  // Foreign key violations
  '23503': { type: 'validation', message: 'Referenced item does not exist.' },
  
  // Not null violations
  '23502': { type: 'validation', message: 'Required field is missing.' },
  
  // Check constraint violations
  '23514': { type: 'validation', message: 'Invalid value provided.' },
  
}

/**
 * Handles Supabase/PostgreSQL errors and returns user-friendly messages
 * 
 * @param error - The error from Supabase
 * @returns Handled error with type and user-friendly message
 */
export function handleSupabaseError(error: PostgrestError | Error | unknown): HandledError {
  // Handle PostgrestError
  if (error && typeof error === 'object' && 'code' in error) {
    const pgError = error as PostgrestError
    const errorMapping = ERROR_MESSAGES[pgError.code]
    
    if (errorMapping) {
      return {
        ...errorMapping,
        originalError: error
      }
    }
    
    // Check for specific error messages
    if (pgError.message?.includes('duplicate key')) {
      return {
        type: 'duplicate',
        message: 'This item already exists.',
        originalError: error
      }
    }
    
    if (pgError.message?.includes('violates foreign key')) {
      return {
        type: 'validation',
        message: 'Invalid reference. The related item does not exist.',
        originalError: error
      }
    }
  }
  
  // Handle network errors
  if (error instanceof Error) {
    if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
      return {
        type: 'network',
        message: 'Network error. Please check your connection and try again.',
        originalError: error
      }
    }
  }
  
  // Default unknown error
  return {
    type: 'unknown',
    message: 'An unexpected error occurred. Please try again.',
    originalError: error
  }
}

/**
 * Type guard to check if an error is an RLS violation
 */
export function isRLSError(error: HandledError): boolean {
  return error.type === 'rls_violation'
}

/**
 * Type guard to check if an error is a duplicate error
 */
export function isDuplicateError(error: HandledError): boolean {
  return error.type === 'duplicate'
}

/**
 * Type guard to check if an error is a not found error
 */
export function isNotFoundError(error: HandledError): boolean {
  return error.type === 'not_found'
}

/**
 * Type guard to check if an error is an authentication error
 */
export function isAuthError(error: HandledError | Error | unknown): boolean {
  // Check if it's a HandledError with RLS violation
  if (error && typeof error === 'object' && 'type' in error) {
    const handledError = error as HandledError
    return handledError.type === 'rls_violation'
  }
  
  // Check if it's a raw error with auth-related messages
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return message.includes('authentication') || 
           message.includes('unauthorized') ||
           message.includes('not authenticated') ||
           message.includes('jwt') ||
           message.includes('token')
  }
  
  return false
}

/**
 * Type guard to check if an error is a connection/network error
 */
export function isConnectionError(error: HandledError | Error | unknown): boolean {
  // Check if it's a HandledError with network type
  if (error && typeof error === 'object' && 'type' in error) {
    const handledError = error as HandledError
    return handledError.type === 'network'
  }
  
  // Check if it's a raw error with network-related messages
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return message.includes('network') || 
           message.includes('fetch') ||
           message.includes('connection') ||
           message.includes('timeout') ||
           message.includes('offline')
  }
  
  return false
}

/**
 * Logs error details for debugging while returning user-friendly message
 */
export function logAndHandleError(
  context: string,
  error: PostgrestError | Error | unknown
): HandledError {
  const handledError = handleSupabaseError(error)
  
  console.error(`[${context}] Error:`, {
    type: handledError.type,
    message: handledError.message,
    original: handledError.originalError
  })
  
  return handledError
}