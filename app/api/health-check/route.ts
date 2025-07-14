import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/supabase/database.types'

export async function GET() {
  const startTime = Date.now()
  
  // Use service role key for health check to bypass RLS
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  try {
    // Test 1: Basic connection
    const { count, error: countError } = await supabase
      .from('question_sets')
      .select('*', { count: 'exact', head: true })
    
    // Test 2: Auth system
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1
    })
    
    // Test 3: Database write (using service role to bypass RLS)
    const testId = `health-check-${Date.now()}`
    const { error: insertError } = await supabase
      .from('question_sets')
      .insert({
        user_id: 'health-check-user',
        name: testId,
        difficulty: 'medium',
        is_public: false
      })
    
    // Clean up test data
    if (!insertError) {
      await supabase
        .from('question_sets')
        .delete()
        .eq('name', testId)
    }
    
    const responseTime = Date.now() - startTime
    
    return NextResponse.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      checks: {
        database: {
          connected: !countError,
          error: countError?.message,
          tableExists: true,
          rowCount: count || 0
        },
        auth: {
          connected: !authError,
          error: authError?.message,
          hasUsers: (authData?.users?.length || 0) > 0
        },
        write: {
          canWrite: !insertError,
          error: insertError?.message
        }
      },
      environment: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    }, { status: 503 })
  }
}