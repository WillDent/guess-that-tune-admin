'use client'

import React from 'react'
import { BaseErrorBoundary } from './base-error-boundary'
import { RLSErrorBoundary } from './rls-error-boundary'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ShieldOff, RefreshCw, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

interface AdminErrorBoundaryProps {
  children: React.ReactNode
  section?: string
}

function isPermissionError(error: Error): boolean {
  const permissionIndicators = [
    'admin',
    'permission',
    'unauthorized',
    'forbidden',
    'not allowed',
    'access denied',
    '403'
  ]
  
  const errorString = error.message?.toLowerCase() || ''
  return permissionIndicators.some(indicator => errorString.includes(indicator))
}

function AdminErrorFallback({ 
  error, 
  retry,
  section
}: { 
  error: Error
  retry: () => void
  section?: string
}) {
  const router = useRouter()
  const { user, isAdmin, signOut } = useAuth()
  const isPermission = isPermissionError(error)
  
  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }
  
  if (isPermission && !isAdmin) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-3 bg-red-100 rounded-full">
              <ShieldOff className="h-8 w-8 text-red-600" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Admin Access Required</h3>
              <p className="text-gray-600 text-sm">
                You need administrator privileges to access {section || 'this section'}.
              </p>
            </div>

            <Alert variant="destructive">
              <AlertTitle>Insufficient Permissions</AlertTitle>
              <AlertDescription>
                Your account ({user?.email}) does not have admin access.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2 w-full">
              <Button 
                onClick={() => router.push('/')} 
                className="flex-1"
              >
                Go Home
              </Button>
              <Button 
                onClick={handleSignOut} 
                variant="outline"
                className="flex-1"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }
  
  // For other admin errors, use RLS boundary as fallback
  return (
    <RLSErrorBoundary fallbackMessage={`Error accessing admin ${section || 'section'}`}>
      {/* This will never render, but satisfies RLSErrorBoundary's children requirement */}
      <div />
    </RLSErrorBoundary>
  )
}

export function AdminErrorBoundary({ 
  children, 
  section
}: AdminErrorBoundaryProps) {
  const { isAdmin } = useAuth()
  
  // Pre-check admin status
  if (!isAdmin) {
    return (
      <AdminErrorFallback 
        error={new Error('Admin access required')} 
        retry={() => window.location.reload()}
        section={section}
      />
    )
  }
  
  return (
    <BaseErrorBoundary
      fallback={(error, _, retry) => (
        <AdminErrorFallback 
          error={error} 
          retry={retry} 
          section={section}
        />
      )}
    >
      {children}
    </BaseErrorBoundary>
  )
}