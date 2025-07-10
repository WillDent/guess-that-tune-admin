/**
 * Supabase utilities index
 * 
 * Central export point for all Supabase-related utilities
 */

// Client creation
export { createClient } from '@/lib/supabase/client'
export { createServerClient } from '@/lib/supabase/server'

// Authentication utilities
export {
  // Session management
  withSession,
  hasValidSession,
  requireSession,
  withSessionRoute,
  requireSessionRoute,
  
  // User authentication
  requireAuth,
  requireAdmin,
  getCurrentUser,
  requireAuthRoute,
  requireAdminRoute,
  
  // Role checks
  hasRole,
  isAdmin,
  
  // Types
  type UserWithRole
} from './auth'

// Error handling
export {
  handleSupabaseError,
  isRLSError,
  isDuplicateError,
  isAuthError,
  isConnectionError,
  logAndHandleError,
  type HandledError
} from './error-handler'