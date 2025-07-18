'use client'

import { useAuth } from '@/contexts/auth-context'
import { useProfile } from '@/hooks/use-profile'
import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client'

export default function TestAuthPage() {
  const { user, loading: authLoading, authInitialized } = useAuth()
  const { profile, loading: profileLoading, error } = useProfile()
  const [testResult, setTestResult] = useState<any>(null)
  const [testError, setTestError] = useState<any>(null)
  const [sessionTest, setSessionTest] = useState<any>(null)

  useEffect(() => {
    // Test direct Supabase query
    const testSupabase = async () => {
      if (!user?.id) return
      
      try {
        const supabase = createSupabaseBrowserClient()
        console.log('[TEST] Starting direct query for user:', user.id)
        
        // Add timeout to detect hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout after 5 seconds')), 5000)
        )
        
        const queryPromise = supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
          
        const { data, error } = await Promise.race([
          queryPromise,
          timeoutPromise
        ]) as any
          
        console.log('[TEST] Query result:', { data, error })
        setTestResult(data)
        setTestError(error)
      } catch (err) {
        console.error('[TEST] Direct query error:', err)
        setTestError(err)
      }
    }
    
    testSupabase()
  }, [user?.id])
  
  useEffect(() => {
    // Test session separately
    const testSession = async () => {
      try {
        const supabase = createSupabaseBrowserClient()
        const { data: { session }, error } = await supabase.auth.getSession()
        setSessionTest({ session: session ? 'Found' : 'None', error })
      } catch (err) {
        setSessionTest({ error: err })
      }
    }
    testSession()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Test Page</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold">Environment:</h2>
          <p className="text-xs break-all">Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'}</p>
          <p className="text-xs">Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'}</p>
        </div>
        
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold">Auth Context:</h2>
          <p>Loading: {authLoading ? 'true' : 'false'}</p>
          <p>Initialized: {authInitialized ? 'true' : 'false'}</p>
          <p>User ID: {user?.id || 'null'}</p>
          <p>User Email: {user?.email || 'null'}</p>
        </div>
        
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold">Profile Hook:</h2>
          <p>Loading: {profileLoading ? 'true' : 'false'}</p>
          <p>Error: {error?.message || 'none'}</p>
          <p>Profile ID: {profile?.id || 'null'}</p>
          <p>Profile Email: {profile?.email || 'null'}</p>
        </div>
        
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold">Direct Query Test:</h2>
          {testError ? (
            <p className="text-red-600">Error: {JSON.stringify(testError)}</p>
          ) : testResult ? (
            <div>
              <p>Success! User found:</p>
              <p className="text-sm">ID: {testResult.id}</p>
              <p className="text-sm">Email: {testResult.email}</p>
            </div>
          ) : (
            <p>Testing...</p>
          )}
        </div>
        
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-semibold">Session Test:</h2>
          {sessionTest ? (
            <div>
              <p>Session: {sessionTest.session}</p>
              {sessionTest.error && <p className="text-red-600">Error: {JSON.stringify(sessionTest.error)}</p>}
            </div>
          ) : (
            <p>Testing session...</p>
          )}
        </div>
      </div>
    </div>
  )
}