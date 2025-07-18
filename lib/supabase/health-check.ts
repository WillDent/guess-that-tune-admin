import { SupabaseClient } from '@supabase/supabase-js'

export interface HealthCheckResult {
  healthy: boolean
  error?: string
  details?: {
    auth?: { ok: boolean; error?: string }
    database?: { ok: boolean; error?: string }
    connection?: { ok: boolean; error?: string }
  }
  timestamp: string
  responseTime?: number
}

/**
 * Check the health of a Supabase client connection
 * @param client - The Supabase client to check
 * @returns Health check result with detailed status
 */
export async function checkSupabaseHealth(
  client: SupabaseClient
): Promise<HealthCheckResult> {
  const startTime = performance.now()
  const timestamp = new Date().toISOString()
  const details: HealthCheckResult['details'] = {}
  
  try {
    // Test 1: Auth system
    try {
      const { data: { session }, error: authError } = await client.auth.getSession()
      details.auth = {
        ok: !authError,
        error: authError?.message
      }
      
      // If no session, try to get user (will fail but tests auth connection)
      if (!session) {
        const { error: userError } = await client.auth.getUser()
        if (userError && userError.message !== 'Auth session missing!') {
          details.auth = {
            ok: false,
            error: userError.message
          }
        }
      }
    } catch (error) {
      details.auth = {
        ok: false,
        error: error instanceof Error ? error.message : 'Auth check failed'
      }
    }

    // Test 2: Database connection
    try {
      // Use a lightweight query that should always work
      const { error: dbError } = await client
        .from('question_sets')
        .select('count', { count: 'exact', head: true })
      
      if (dbError) {
        // Check if it's just an RLS error (which means DB is connected)
        if (dbError.code === 'PGRST301' || dbError.message.includes('row-level security')) {
          details.database = { ok: true }
        } else {
          details.database = {
            ok: false,
            error: dbError.message
          }
        }
      } else {
        details.database = { ok: true }
      }
    } catch (error) {
      details.database = {
        ok: false,
        error: error instanceof Error ? error.message : 'Database check failed'
      }
    }

    // Test 3: General connection
    try {
      // Try to access the REST endpoint directly
      const { error: connError } = await client
        .from('_health_check')
        .select('*')
        .limit(0)
      
      // Table doesn't exist is fine, it means we can connect
      if (connError?.code === '42P01') {
        details.connection = { ok: true }
      } else if (connError) {
        details.connection = {
          ok: false,
          error: connError.message
        }
      } else {
        details.connection = { ok: true }
      }
    } catch (error) {
      details.connection = {
        ok: false,
        error: error instanceof Error ? error.message : 'Connection check failed'
      }
    }

    const responseTime = performance.now() - startTime
    
    // Determine overall health
    const healthy = 
      (details.auth?.ok !== false) && 
      (details.database?.ok !== false) && 
      (details.connection?.ok !== false)

    return {
      healthy,
      details,
      timestamp,
      responseTime: Math.round(responseTime)
    }
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details,
      timestamp,
      responseTime: Math.round(performance.now() - startTime)
    }
  }
}

/**
 * Perform a quick health check (lighter weight)
 */
export async function quickHealthCheck(
  client: SupabaseClient
): Promise<boolean> {
  try {
    const { error } = await client
      .from('question_sets')
      .select('count', { count: 'exact', head: true })
    
    // RLS errors are ok, they mean we're connected
    if (error && !error.message.includes('row-level security') && error.code !== 'PGRST301') {
      return false
    }
    
    return true
  } catch {
    return false
  }
}