'use client'

import React, { Component, ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react'

export interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  errorCount: number
}

export interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, errorInfo: React.ErrorInfo | null, retry: () => void) => ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo | null) => void
  resetKeys?: Array<string | number>
  resetOnPropsChange?: boolean
  isolate?: boolean
  showDetails?: boolean
}

export class BaseErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { onError } = this.props
    
    // Log error details
    console.error('Error Boundary Caught:', error)
    console.error('Error Info:', errorInfo)
    console.error('Component Stack:', errorInfo.componentStack)
    
    // Update state with error info
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }))
    
    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo)
    }
    
    // Report to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo)
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props
    const { hasError } = this.state
    
    // Reset on prop changes if enabled
    if (hasError && prevProps.resetOnPropsChange !== false) {
      if (resetKeys?.some((key, idx) => key !== prevProps.resetKeys?.[idx])) {
        this.resetErrorBoundary()
      }
    }
  }

  reportError = (error: Error, errorInfo: React.ErrorInfo | null) => {
    // Integrate with error reporting service
    // Example: Sentry, LogRocket, etc.
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    }
    
    console.log('Error Report:', errorReport)
    // TODO: Send to error tracking service
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    const { hasError, error, errorInfo, errorCount } = this.state
    const { children, fallback, isolate, showDetails } = this.props

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return <>{fallback(error, errorInfo, this.resetErrorBoundary)}</>
      }

      // Default error UI
      return (
        <div className={isolate ? 'contents' : 'min-h-[400px] flex items-center justify-center p-4'}>
          <Card className="max-w-2xl w-full p-6">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>
                {error.message || 'An unexpected error occurred'}
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {/* Error frequency warning */}
              {errorCount > 2 && (
                <Alert>
                  <Bug className="h-4 w-4" />
                  <AlertDescription>
                    This error has occurred {errorCount} times. There might be a persistent issue.
                  </AlertDescription>
                </Alert>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button onClick={this.resetErrorBoundary} variant="default">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  onClick={() => window.location.href = '/'} 
                  variant="outline"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>

              {/* Error details (development only by default) */}
              {(showDetails || process.env.NODE_ENV === 'development') && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                    Error Details
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div className="bg-gray-100 p-3 rounded text-xs font-mono overflow-x-auto">
                      <strong>Error:</strong> {error.toString()}
                    </div>
                    {error.stack && (
                      <div className="bg-gray-100 p-3 rounded text-xs font-mono overflow-x-auto">
                        <strong>Stack Trace:</strong>
                        <pre className="whitespace-pre-wrap">{error.stack}</pre>
                      </div>
                    )}
                    {errorInfo?.componentStack && (
                      <div className="bg-gray-100 p-3 rounded text-xs font-mono overflow-x-auto">
                        <strong>Component Stack:</strong>
                        <pre className="whitespace-pre-wrap">{errorInfo.componentStack}</pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          </Card>
        </div>
      )
    }

    return children
  }
}