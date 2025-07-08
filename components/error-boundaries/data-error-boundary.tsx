'use client'

import React from 'react'
import { BaseErrorBoundary } from './base-error-boundary'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { WifiOff, RefreshCw, Database, Clock } from 'lucide-react'

interface DataErrorBoundaryProps {
  children: React.ReactNode
  resource?: string
  onRetry?: () => void
}

function getErrorType(error: Error): 'network' | 'timeout' | 'database' | 'unknown' {
  const message = error.message?.toLowerCase() || ''
  
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return 'network'
  }
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'timeout'
  }
  if (message.includes('database') || message.includes('postgres') || message.includes('supabase')) {
    return 'database'
  }
  return 'unknown'
}

function DataErrorFallback({ 
  error, 
  retry,
  resource,
  onRetry
}: { 
  error: Error
  retry: () => void
  resource?: string
  onRetry?: () => void
}) {
  const errorType = getErrorType(error)
  
  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    }
    retry()
  }
  
  const getIcon = () => {
    switch (errorType) {
      case 'network':
        return <WifiOff className="h-8 w-8 text-gray-400" />
      case 'timeout':
        return <Clock className="h-8 w-8 text-gray-400" />
      case 'database':
        return <Database className="h-8 w-8 text-gray-400" />
      default:
        return <Database className="h-8 w-8 text-gray-400" />
    }
  }
  
  const getTitle = () => {
    switch (errorType) {
      case 'network':
        return 'Connection Problem'
      case 'timeout':
        return 'Request Timed Out'
      case 'database':
        return 'Database Error'
      default:
        return 'Loading Error'
    }
  }
  
  const getMessage = () => {
    switch (errorType) {
      case 'network':
        return 'Unable to connect to the server. Please check your internet connection.'
      case 'timeout':
        return 'The request took too long. The server might be busy.'
      case 'database':
        return `Unable to load ${resource || 'data'}. Please try again.`
      default:
        return `Failed to load ${resource || 'content'}. Please try again.`
    }
  }
  
  return (
    <div className="flex items-center justify-center p-8">
      <Card className="max-w-md w-full p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-3 bg-gray-100 rounded-full">
            {getIcon()}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">{getTitle()}</h3>
            <p className="text-gray-600 text-sm">{getMessage()}</p>
          </div>

          <Button onClick={handleRetry} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>

          {process.env.NODE_ENV === 'development' && (
            <Alert className="mt-4">
              <AlertDescription className="text-xs font-mono">
                {error.message}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </Card>
    </div>
  )
}

export function DataErrorBoundary({ 
  children, 
  resource,
  onRetry
}: DataErrorBoundaryProps) {
  return (
    <BaseErrorBoundary
      fallback={(error, _, retry) => (
        <DataErrorFallback 
          error={error} 
          retry={retry} 
          resource={resource}
          onRetry={onRetry}
        />
      )}
      isolate
    >
      {children}
    </BaseErrorBoundary>
  )
}