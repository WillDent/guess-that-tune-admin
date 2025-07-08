'use client'

import React from 'react'
import { BaseErrorBoundary } from './base-error-boundary'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

interface RootErrorBoundaryProps {
  children: React.ReactNode
}

function RootErrorFallback({ 
  error, 
  retry 
}: { 
  error: Error
  retry: () => void
}) {
  // Check if it's a chunk loading error (common in Next.js)
  const isChunkError = error.message?.includes('Loading chunk') || 
                      error.message?.includes('Failed to fetch dynamically imported module')
  
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-red-100 rounded-full">
                <AlertCircle className="h-12 w-12 text-red-600" />
              </div>
              
              <div>
                <h1 className="text-2xl font-bold mb-2">
                  {isChunkError ? 'Update Required' : 'Application Error'}
                </h1>
                <p className="text-gray-600">
                  {isChunkError 
                    ? 'A new version of the app is available. Please refresh the page.'
                    : 'We encountered an unexpected error. Please try refreshing the page.'}
                </p>
              </div>

              <div className="flex gap-3 w-full pt-4">
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Page
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Go Home
                </button>
              </div>

              {process.env.NODE_ENV === 'development' && (
                <details className="mt-6 w-full">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Error Details (Development Only)
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs text-left font-mono overflow-auto">
                    <div className="mb-2">
                      <strong>Message:</strong> {error.message}
                    </div>
                    {error.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="whitespace-pre-wrap mt-1">{error.stack}</pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}

export function RootErrorBoundary({ children }: RootErrorBoundaryProps) {
  return (
    <BaseErrorBoundary
      fallback={(error, _, retry) => (
        <RootErrorFallback error={error} retry={retry} />
      )}
      onError={(error, errorInfo) => {
        // Log critical errors
        console.error('Root Error Boundary:', error)
        
        // In production, send to error tracking
        if (process.env.NODE_ENV === 'production') {
          // TODO: Send to Sentry, LogRocket, etc.
        }
      }}
    >
      {children}
    </BaseErrorBoundary>
  )
}