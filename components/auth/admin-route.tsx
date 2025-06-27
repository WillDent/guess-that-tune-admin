'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useIsAdmin } from '@/hooks/use-is-admin'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface AdminRouteProps {
  children: React.ReactNode
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { isAdmin, loading } = useIsAdmin()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/?error=unauthorized')
    }
  }, [isAdmin, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return <>{children}</>
}