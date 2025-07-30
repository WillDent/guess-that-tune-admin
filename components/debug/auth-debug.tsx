'use client'

import { useEffect, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import { X, Eye, EyeOff } from 'lucide-react'

export function AuthDebug() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  
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
  
  // Load saved visibility preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('debug-panel-visible')
    if (saved !== null) {
      setIsVisible(saved === 'true')
    }
  }, [])
  
  // Save visibility preference to localStorage
  const toggleVisibility = () => {
    const newValue = !isVisible
    setIsVisible(newValue)
    localStorage.setItem('debug-panel-visible', String(newValue))
  }
  
  if (!debugInfo) return null
  
  return (
    <>
      {/* Toggle button */}
      <button
        onClick={toggleVisibility}
        className="fixed bottom-4 right-4 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-lg z-50 transition-colors"
        title={isVisible ? "Hide debug info" : "Show debug info"}
      >
        {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
      
      {/* Debug panel */}
      {isVisible && (
        <div className="fixed bottom-4 right-14 bg-black text-white rounded-lg text-xs max-w-md z-50 shadow-lg">
          <div className="flex items-center justify-between p-3 border-b border-gray-700">
            <div className="font-bold">Auth Debug Info</div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="hover:bg-gray-800 p-1 rounded transition-colors"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? '−' : '+'}
            </button>
          </div>
          {isExpanded && (
            <pre className="p-4 overflow-auto max-h-96">{JSON.stringify(debugInfo, null, 2)}</pre>
          )}
        </div>
      )}
    </>
  )
}