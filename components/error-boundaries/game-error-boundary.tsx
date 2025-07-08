'use client'

import React from 'react'
import { BaseErrorBoundary } from './base-error-boundary'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Gamepad2, RefreshCw, Home, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface GameErrorBoundaryProps {
  children: React.ReactNode
  gameId?: string
  onReset?: () => void
}

function isGameStateError(error: Error): boolean {
  const gameErrors = [
    'game not found',
    'game already started',
    'game ended',
    'invalid game state',
    'not enough players',
    'maximum players reached'
  ]
  
  const errorString = error.message?.toLowerCase() || ''
  return gameErrors.some(gameError => errorString.includes(gameError))
}

function GameErrorFallback({ 
  error, 
  retry,
  gameId,
  onReset
}: { 
  error: Error
  retry: () => void
  gameId?: string
  onReset?: () => void
}) {
  const router = useRouter()
  const isGameState = isGameStateError(error)
  
  const handleReset = () => {
    if (onReset) {
      onReset()
    }
    retry()
  }
  
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-3 bg-orange-100 rounded-full">
            {isGameState ? (
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            ) : (
              <Gamepad2 className="h-8 w-8 text-orange-600" />
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">
              {isGameState ? 'Game Issue' : 'Game Error'}
            </h3>
            <p className="text-gray-600 text-sm">
              {isGameState 
                ? error.message 
                : 'Something went wrong with the game. Please try again.'}
            </p>
          </div>

          {isGameState && (
            <Alert>
              <AlertDescription>
                This might happen if the game has already started, ended, or was deleted.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 w-full">
            {!isGameState && (
              <Button onClick={handleReset} className="flex-1">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            <Button 
              onClick={() => router.push('/games')} 
              variant={isGameState ? "default" : "outline"}
              className="flex-1"
            >
              <Home className="h-4 w-4 mr-2" />
              Back to Games
            </Button>
          </div>

          {gameId && (
            <p className="text-xs text-gray-500">
              Game ID: {gameId}
            </p>
          )}

          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 w-full">
              <summary className="cursor-pointer text-xs text-gray-500">
                Error Details
              </summary>
              <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-left">
                <pre className="whitespace-pre-wrap">{error.stack}</pre>
              </div>
            </details>
          )}
        </div>
      </Card>
    </div>
  )
}

export function GameErrorBoundary({ 
  children, 
  gameId,
  onReset
}: GameErrorBoundaryProps) {
  return (
    <BaseErrorBoundary
      fallback={(error, _, retry) => (
        <GameErrorFallback 
          error={error} 
          retry={retry} 
          gameId={gameId}
          onReset={onReset}
        />
      )}
      resetKeys={gameId ? [gameId] : []}
      isolate
    >
      {children}
    </BaseErrorBoundary>
  )
}