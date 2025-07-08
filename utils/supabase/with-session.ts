import { SupabaseClient, Session } from '@supabase/supabase-js'

/**
 * Wraps a Supabase operation with session validation
 * Ensures a valid session exists before executing RLS-protected queries
 * 
 * @param supabase - The Supabase client instance
 * @param callback - The operation to execute if session is valid
 * @returns The result of the callback or null if no valid session
 */
export async function withSession<T>(
  supabase: SupabaseClient,
  callback: (session: Session) => Promise<T>
): Promise<T | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('[withSession] Error getting session:', error)
      return null
    }
    
    if (!session) {
      console.log('[withSession] No valid session for protected query')
      return null
    }
    
    // Session is valid, execute the callback
    return await callback(session)
  } catch (err) {
    console.error('[withSession] Unexpected error:', err)
    return null
  }
}

/**
 * Checks if a valid session exists
 * Useful for conditional rendering or early returns
 * 
 * @param supabase - The Supabase client instance
 * @returns Whether a valid session exists
 */
export async function hasValidSession(
  supabase: SupabaseClient
): Promise<boolean> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    return !error && !!session
  } catch {
    return false
  }
}

/**
 * Gets the current session or throws an error
 * Use this when a session is required and you want to handle errors upstream
 * 
 * @param supabase - The Supabase client instance
 * @returns The current session
 * @throws Error if no valid session exists
 */
export async function requireSession(
  supabase: SupabaseClient
): Promise<Session> {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    throw new Error(`Authentication error: ${error.message}`)
  }
  
  if (!session) {
    throw new Error('No valid session. Please log in.')
  }
  
  return session
}