'use client'

import React from 'react'
import { BaseErrorBoundary } from './base-error-boundary'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Shield, LogIn, RefreshCw, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

interface RLSErrorBoundaryProps {
  children: React.ReactNode
  fallbackMessage?: string
  requireAuth?: boolean
  onError?: (error: Error) => void
}

function isRLSError(error: Error): boolean {
  const rlsIndicators = [
    'row-level security',
    'RLS',
    'policy',
    'permission denied',
    'insufficient privileges',
    'new row violates row-level security policy',
    'PGRST301',
    '42501'
  ]
  
  const errorString = error.toString().toLowerCase()
  const messageString = error.message?.toLowerCase() || ''
  
  return rlsIndicators.some(indicator => 
    errorString.includes(indicator.toLowerCase()) || 
    messageString.includes(indicator.toLowerCase())
  )
}

function RLSErrorFallback({ 
  error, 
  retry, 
  fallbackMessage 
}: { 
  error: Error
  retry: () => void
  fallbackMessage?: string 
}) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const isRLS = isRLSError(error)
  
  if (!isRLS) {
    // Not an RLS error, show generic error
    return (
      <div className="min-h-[400px] flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Data</AlertTitle>
            <AlertDescription>
              {error.message || 'An unexpected error occurred'}
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={retry} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    )
  }
  
  // RLS error handling
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-3 bg-red-100 rounded-full">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-gray-600 text-sm">
              {fallbackMessage || "You don't have permission to view this content."}
            </p>
          </div>

          {!user && !loading && (
            <Alert>
              <LogIn className="h-4 w-4" />
              <AlertDescription>
                You may need to log in to access this content.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 w-full">
            {!user && !loading ? (
              <Button 
                onClick={() => router.push('/login')} 
                className="flex-1"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Log In
              </Button>
            ) : (
              <Button onClick={retry} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            <Button 
              onClick={() => router.push('/')} 
              variant="outline"
              className="flex-1"
            >
              Go Home
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 w-full">
              <summary className="cursor-pointer text-xs text-gray-500">
                Debug Info
              </summary>
              <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-left">
                <pre className="whitespace-pre-wrap">{error.message}</pre>
              </div>
            </details>
          )}
        </div>
      </Card>
    </div>
  )
}

export function RLSErrorBoundary({ 
  children, 
  fallbackMessage,
  requireAuth = false,
  onError
}: RLSErrorBoundaryProps) {
  return (
    <BaseErrorBoundary
      fallback={(error, _, retry) => (
        <RLSErrorFallback 
          error={error} 
          retry={retry} 
          fallbackMessage={fallbackMessage}
        />
      )}
      onError={onError}
      isolate={!requireAuth}
    >
      {children}
    </BaseErrorBoundary>
  )
}