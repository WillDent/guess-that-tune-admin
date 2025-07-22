'use client'

import { useAuth } from '@/contexts/auth-context'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function AuthTestPage() {
  const { user, loading, isAdmin, authInitialized } = useAuth()
  
  useEffect(() => {
    console.log('[AUTH-TEST] Current auth state:', {
      user: user?.email,
      userId: user?.id,
      role: (user as any)?.role,
      isAdmin,
      loading,
      authInitialized,
      userMetadata: user?.user_metadata,
      appMetadata: user?.app_metadata
    })
  }, [user, isAdmin, loading, authInitialized])
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Auth State Debug Page</h1>
      
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Current Auth State</h2>
        <div className="space-y-2">
          <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
          <p><strong>Auth Initialized:</strong> {authInitialized ? 'Yes' : 'No'}</p>
          <p><strong>User Email:</strong> {user?.email || 'Not logged in'}</p>
          <p><strong>User ID:</strong> {user?.id || 'N/A'}</p>
          <p><strong>User Role:</strong> {(user as any)?.role || 'N/A'}</p>
          <p><strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}</p>
          <p><strong>Super Admin Email:</strong> {process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || 'Not set'}</p>
        </div>
      </Card>
      
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">User Object (Raw)</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
          {JSON.stringify(user, null, 2)}
        </pre>
      </Card>
      
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Actions</h2>
        <div className="space-x-4">
          <Button 
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
          <Button 
            onClick={() => window.location.href = '/login'}
            variant="outline"
          >
            Go to Login
          </Button>
        </div>
      </Card>
    </div>
  )
}