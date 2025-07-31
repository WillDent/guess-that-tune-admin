'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Users, 
  Copy, 
  Check, 
  X, 
  Play,
  Crown,
  Wifi,
  WifiOff,
  Loader2
} from 'lucide-react'
import { useGameRoom } from '@/hooks/use-game-room'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/auth-context'

interface GameLobbyProps {
  gameId: string
}

export function GameLobby({ gameId }: GameLobbyProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const {
    game,
    players,
    loading,
    error,
    isHost,
    setReady,
    startGame
  } = useGameRoom(gameId)
  
  const [isReady, setIsReady] = useState(false)
  const [copied, setCopied] = useState(false)
  const [starting, setStarting] = useState(false)
  
  const currentPlayer = players.find(p => p.user_id === user?.id)
  const readyCount = players.filter(p => p.is_ready).length
  const allReady = players.length > 1 && readyCount === players.length

  const copyGameCode = () => {
    if (game?.game_code) {
      navigator.clipboard.writeText(game.game_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Game code copied!')
    }
  }

  const handleReadyToggle = (checked: boolean) => {
    setIsReady(checked)
    setReady(checked)
  }

  const handleStartGame = async () => {
    if (!allReady) {
      toast.error('All players must be ready to start')
      return
    }
    
    setStarting(true)
    await startGame()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !game) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load game. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Game Code */}
      <Card className="p-8 text-center">
        <h2 className="text-2xl font-semibold mb-2">Game Code</h2>
        <div className="flex items-center justify-center gap-4">
          <div className="text-6xl font-mono font-bold tracking-wider">
            {game.game_code}
          </div>
          <Button
            size="lg"
            variant="outline"
            onClick={copyGameCode}
          >
            {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
          </Button>
        </div>
        <p className="text-gray-600 mt-4">
          Share this code with your friends to join the game
        </p>
      </Card>

      {/* Game Info */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Game Settings</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Game ID:</span>
            <span className="font-medium">{game.id.slice(0, 8)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className="font-medium capitalize">{game.status}</span>
          </div>
        </div>
      </Card>

      {/* Players */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Players ({players.length})
          </h3>
          {!isHost && (
            <div className="flex items-center gap-3">
              <Label htmlFor="ready-toggle" className="text-sm">
                Ready to play
              </Label>
              <Switch
                id="ready-toggle"
                checked={isReady}
                onCheckedChange={handleReadyToggle}
              />
            </div>
          )}
        </div>

        <div className="space-y-3">
          {players.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <span className="font-semibold text-purple-600 dark:text-purple-300">
                    {player.display_name[0]?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{player.display_name}</span>
                    {player.is_host && (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    {player.presence_state === 'online' ? (
                      <>
                        <Wifi className="h-3 w-3" />
                        Online
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-3 w-3" />
                        Away
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {player.is_ready ? (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <Check className="h-3 w-3 mr-1" />
                    Ready
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-500">
                    <X className="h-3 w-3 mr-1" />
                    Not Ready
                  </Badge>
                )}
              </div>
            </div>
          ))}
          
          {/* Empty slots */}
          {false && Array.from({ length: Math.max(0, 0) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="flex items-center justify-center p-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700"
            >
              <span className="text-sm text-gray-500">Waiting for player...</span>
            </div>
          ))}
        </div>

        {/* Start Game Button */}
        {isHost && (
          <div className="mt-6">
            <Button
              size="lg"
              className="w-full"
              onClick={handleStartGame}
              disabled={!allReady || starting || players.length < 2}
            >
              {starting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Starting Game...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Start Game
                </>
              )}
            </Button>
            {players.length < 2 && (
              <p className="text-sm text-center text-gray-500 mt-2">
                Need at least 2 players to start
              </p>
            )}
            {players.length >= 2 && !allReady && (
              <p className="text-sm text-center text-yellow-600 mt-2">
                Waiting for all players to be ready ({readyCount}/{players.length} ready)
              </p>
            )}
          </div>
        )}
        
        {!isHost && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Waiting for the host to start the game...
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}