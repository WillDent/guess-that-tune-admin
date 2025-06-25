'use client'

import { useParams } from 'next/navigation'
import { useGameRoom } from '@/hooks/use-game-room'
import { GameLobby } from '@/components/games/game-lobby'
import { GamePlay } from '@/components/games/game-play'
import { GameResults } from '@/components/games/game-results'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function GamePage() {
  const params = useParams()
  const gameId = params.id as string
  const { gameState, loading, error } = useGameRoom(gameId)

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute>
        <div className="max-w-2xl mx-auto mt-8">
          <Link href="/games">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Games
            </Button>
          </Link>
          <Alert variant="destructive">
            <AlertDescription>
              {error.message || 'Failed to load game. Please try again.'}
            </AlertDescription>
          </Alert>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <Link href="/games">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Games
            </Button>
          </Link>

          {gameState === 'lobby' && <GameLobby gameId={gameId} />}
          {gameState === 'playing' && <GamePlay gameId={gameId} />}
          {gameState === 'finished' && <GameResults gameId={gameId} />}
        </div>
      </div>
    </ProtectedRoute>
  )
}