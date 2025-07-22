'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client'

export function AuthDebug() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createSupabaseBrowserClient()
      
      // Check session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      // Check user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      // Check cookies in browser
      const cookies = document.cookie.split(';').map(c => c.trim())
      const authCookies = cookies.filter(c => c.includes('sb-') || c.includes('auth'))
      
      // Call our API endpoint
      let apiResponse = null
      try {
        const res = await fetch('/api/auth/check')
        apiResponse = await res.json()
      } catch (e) {
        apiResponse = { error: 'Failed to call API' }
      }
      
      setDebugInfo({
        clientSession: {
          exists: !!session,
          user: session?.user?.email,
          error: sessionError?.message
        },
        clientUser: {
          exists: !!user,
          email: user?.email,
          error: userError?.message
        },
        cookies: {
          total: cookies.length,
          authCookies: authCookies.length,
          authCookieNames: authCookies.map(c => c.split('=')[0])
        },
        apiResponse
      })
    }
    
    checkAuth()
  }, [])
  
  if (!debugInfo) return <div>Loading auth debug info...</div>
  
  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-md overflow-auto max-h-96 z-50">
      <div className="font-bold mb-2">Auth Debug Info</div>
      <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
    </div>
  )
}