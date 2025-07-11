'use client'

import { useAuth } from '@/contexts/auth-context'
import { redirect, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ProtectedRoute({ 
  children, 
  fallback 
}: ProtectedRouteProps) {
  const { user, loading, authInitialized } = useAuth()
  const pathname = usePathname()


  // Show loading state while auth is initializing
  if (loading || !authInitialized) {
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

  // Redirect to login if not authenticated after auth has initialized
  if (!user && authInitialized) {
    redirect(`/login?next=${encodeURIComponent(pathname)}`)
  }

  // Render children if authenticated
  return <>{children}</>
}