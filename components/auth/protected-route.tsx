'use client'

import { useAuth } from '@/contexts/auth-context'
import { redirect, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ProtectedRoute({ 
  children, 
  fallback 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const [hasWaited, setHasWaited] = useState(false)

  console.log('[PROTECTED-ROUTE]', pathname, 'Auth state:', { 
    user: user?.email, 
    loading, 
    hasWaited 
  })

  // Add a small delay after initial load to ensure auth state has time to update
  // This helps prevent redirect loops when navigating immediately after login
  useEffect(() => {
    console.log('[PROTECTED-ROUTE] useEffect triggered:', { loading, user: user?.email })
    if (!loading && !user) {
      console.log('[PROTECTED-ROUTE] No user after loading, starting wait timer...')
      const timer = setTimeout(() => {
        console.log('[PROTECTED-ROUTE] Wait timer completed, setting hasWaited=true')
        setHasWaited(true)
      }, 2000) // Increased to 2 seconds to ensure auth cookies are properly set
      
      return () => {
        console.log('[PROTECTED-ROUTE] Cleaning up timer')
        clearTimeout(timer)
      }
    } else if (!loading && user) {
      console.log('[PROTECTED-ROUTE] User found, resetting hasWaited to false')
      setHasWaited(false) // Reset wait state when user is present
    }
  }, [loading, user])

  // Show loading state while checking auth or waiting for auth to propagate
  if (loading || (!user && !hasWaited)) {
    console.log('[PROTECTED-ROUTE] Showing loading state:', { loading, user: user?.email, hasWaited })
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      )
    )
  }

  // Redirect to login if not authenticated after waiting period
  if (!user && hasWaited) {
    console.log('[PROTECTED-ROUTE] Redirecting to login - no user after wait period')
    redirect(`/login?next=${encodeURIComponent(pathname)}`)
  }

  // Render children if authenticated
  console.log('[PROTECTED-ROUTE] Rendering children - user authenticated:', user?.email)
  return <>{children}</>
}