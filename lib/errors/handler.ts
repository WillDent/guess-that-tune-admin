import { PostgrestError } from '@supabase/supabase-js'
import {
  AppError,
  NetworkError,
  AuthError,
  PermissionError,
  NotFoundError,
  RateLimitError,
  ServerError,
  ValidationError
} from './types'

export const errorHandler = {
  handle(error: unknown): AppError {
    if (error instanceof AppError) return error
    
    // Supabase errors
    if (isSupabaseError(error)) {
      return mapSupabaseError(error)
    }
    
    // Network errors
    if (isNetworkError(error)) {
      return new NetworkError()
    }
    
    // Default error with message
    if (error instanceof Error) {
      return new AppError(error.message, 'UNKNOWN_ERROR', 500, false)
    }
    
    // Unknown error
    return new AppError('An unexpected error occurred', 'UNKNOWN_ERROR', 500, false)
  },
  
  getErrorMessage(error: AppError): string {
    const messages: Record<string, string> = {
      'NETWORK_ERROR': 'Please check your internet connection and try again',
      'AUTH_REQUIRED': 'Please log in to continue',
      'PERMISSION_DENIED': 'You don\'t have permission to perform this action',
      'NOT_FOUND': 'The requested resource was not found',
      'RATE_LIMITED': 'Too many requests. Please wait a moment and try again',
      'SERVER_ERROR': 'Something went wrong on our end. Please try again later',
      'VALIDATION_ERROR': 'Please check your input and try again',
      'UNKNOWN_ERROR': 'An unexpected error occurred. Please try again'
    }
    
    return messages[error.code] || error.message
  },

  getRecoveryActions(error: AppError) {
    const actions = []

    if (error.isRetryable) {
      actions.push({
        label: 'Retry',
        action: 'retry',
        variant: 'default' as const
      })
    }

    switch (error.code) {
      case 'AUTH_REQUIRED':
        actions.push({
          label: 'Log In',
          action: 'login',
          variant: 'default' as const
        })
        break
      case 'NETWORK_ERROR':
        actions.push({
          label: 'Check Connection',
          action: 'check-connection',
          variant: 'outline' as const
        })
        break
      case 'NOT_FOUND':
        actions.push({
          label: 'Go Back',
          action: 'go-back',
          variant: 'default' as const
        })
        break
    }

    return actions
  }
}

function isSupabaseError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'details' in error
  )
}

function mapSupabaseError(error: PostgrestError): AppError {
  // Map common Supabase error codes
  switch (error.code) {
    case 'PGRST301':
      return new AuthError('Authentication required')
    case '42501':
      return new PermissionError('Insufficient permissions')
    case '23505':
      return new ValidationError('This record already exists', {})
    case '23503':
      return new ValidationError('Invalid reference', {})
    case '22P02':
      return new ValidationError('Invalid input format', {})
    case 'PGRST116':
      return new NotFoundError('Resource not found')
    default:
      // Check for rate limiting
      if (error.message.includes('rate limit')) {
        return new RateLimitError()
      }
      // Default to server error
      return new ServerError(error.message)
  }
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('Failed to fetch') ||
      error.name === 'NetworkError'
    )
  }
  return false
}