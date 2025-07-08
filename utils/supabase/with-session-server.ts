import { SupabaseClient, Session } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * Server-side version of withSession for API routes
 * Wraps a Supabase operation with session validation and returns appropriate HTTP responses
 * 
 * @param supabase - The Supabase server client instance
 * @param callback - The operation to execute if session is valid
 * @returns NextResponse with the result or error
 */
export async function withSessionRoute<T>(
  supabase: SupabaseClient,
  callback: (session: Session) => Promise<T>
): Promise<NextResponse> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('[withSessionRoute] Auth error:', error)
      return NextResponse.json(
        { error: 'Authentication error', details: error.message },
        { status: 401 }
      )
    }
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', details: 'No valid session' },
        { status: 401 }
      )
    }
    
    // Session is valid, execute the callback
    const result = await callback(session)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[withSessionRoute] Operation error:', err)
    
    // Check if it's an RLS error
    if (err && typeof err === 'object' && 'code' in err) {
      const error = err as any
      if (error.code === 'PGRST116' || error.code === '42501') {
        return NextResponse.json(
          { error: 'Access denied', details: 'Insufficient permissions' },
          { status: 403 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Validates session and returns it or throws an HTTP response
 * Use in API routes where you need the session for multiple operations
 * 
 * @param supabase - The Supabase server client instance
 * @returns The session or throws NextResponse with error
 */
export async function requireSessionRoute(
  supabase: SupabaseClient
): Promise<Session> {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    throw NextResponse.json(
      { error: 'Authentication error', details: error.message },
      { status: 401 }
    )
  }
  
  if (!session) {
    throw NextResponse.json(
      { error: 'Unauthorized', details: 'No valid session' },
      { status: 401 }
    )
  }
  
  return session
}