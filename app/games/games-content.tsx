// ABOUTME: Client component for games page interactivity
'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Users, 
  Trophy, 
  Calendar, 
  Gamepad2, 
  Play,
  Eye,
  Copy,
  Hash,
  Clock,
  AlertCircle
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { errorHandler } from '@/lib/errors/handler'
import { CreateGameModal } from '@/components/games/create-game-modal'
import { useRouter } from 'next/navigation'
import { GAME_STATUS } from '@/lib/constants/game-status'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { createClient } from '@/lib/supabase/client'
import type { GameWithDetails } from './types'

interface GamesContentProps {
  activeGames: GameWithDetails[]
  completedGames: GameWithDetails[]
  userId: string
}

export function GamesContent({ activeGames, completedGames, userId }: GamesContentProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'join'>('active')
  const [joinCode, setJoinCode] = useState('')
  const [joiningGame, setJoiningGame] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const handleJoinGame = async () => {
    if (!joinCode || joinCode.length !== 6) {
      toast.error('Please enter a valid 6-character join code')
      return
    }

    setJoiningGame(true)
    try {
      const supabase = createClient()
      
      // Find game by join code
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('id, status')
        .eq('code', joinCode.toUpperCase())
        .single()

      if (gameError || !game) {
        toast.error('Game not found. Please check the join code.')
        return
      }

      if (game.status !== GAME_STATUS.PENDING) {
        toast.error('This game has already started or ended.')
        return
      }

      // Check if already joined
      const { data: existingParticipant } = await supabase
        .from('game_participants')
        .select('id')
        .eq('game_id', game.id)
        .eq('user_id', userId)
        .single()

      if (existingParticipant) {
        toast.info('You have already joined this game!')
        router.push(`/game/${game.id}`)
        return
      }

      // Join the game
      const { error: joinError } = await supabase
        .from('game_participants')
        .insert({
          game_id: game.id,
          user_id: userId,
          score: 0
        })

      if (joinError) throw joinError

      toast.success('Successfully joined the game!')
      router.push(`/game/${game.id}`)
    } catch (err) {
      const appError = errorHandler.handle(err)
      toast.error(errorHandler.getErrorMessage(appError))
    } finally {
      setJoiningGame(false)
    }
  }

  const handleCopyJoinCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Join code copied to clipboard!')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case GAME_STATUS.PENDING:
        return <Badge variant="secondary">Waiting to Start</Badge>
      case GAME_STATUS.IN_PROGRESS:
        return <Badge variant="default">In Progress</Badge>
      case GAME_STATUS.COMPLETED:
        return <Badge variant="outline">Completed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const renderGameCard = (game: GameWithDetails) => (
    <Card key={game.id} className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3 sm:mb-4">
        <div className="flex-1 mr-2">
          <h3 className="text-base sm:text-lg font-semibold">{game.name}</h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            {game.question_set.name}
          </p>
        </div>
        {getStatusBadge(game.status)}
      </div>

      <div className="space-y-2 mb-3 sm:mb-4">
        <div className="flex items-center text-xs sm:text-sm text-gray-600">
          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
          {formatDate(game.created_at)}
        </div>
        <div className="flex items-center text-xs sm:text-sm text-gray-600">
          <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
          {game.participant_count || 0} participants
        </div>
        {game.code && game.status === GAME_STATUS.PENDING && (
          <div className="flex items-center text-xs sm:text-sm">
            <Hash className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
            <code className="font-mono bg-gray-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm">
              {game.code}
            </code>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleCopyJoinCode(game.code!)}
              className="ml-1 sm:ml-2 p-1 sm:p-2"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-1 sm:gap-2">
        {game.status === GAME_STATUS.PENDING && game.host_user_id === userId ? (
          <Button 
            size="sm" 
            className="flex-1"
            onClick={() => router.push(`/game/${game.id}/host`)}
          >
            <Play className="h-4 w-4 mr-1" />
            Start Game
          </Button>
        ) : game.status === GAME_STATUS.IN_PROGRESS ? (
          <Button 
            size="sm" 
            className="flex-1"
            onClick={() => router.push(`/game/${game.id}`)}
          >
            <Gamepad2 className="h-4 w-4 mr-1" />
            Continue Playing
          </Button>
        ) : (
          <Button 
            size="sm" 
            variant="outline"
            className="flex-1"
            onClick={() => router.push(`/game/${game.id}/results`)}
          >
            <Trophy className="h-4 w-4 mr-1" />
            View Results
          </Button>
        )}
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => router.push(`/game/${game.id}`)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )

  return (
    <>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active" className="text-xs sm:text-sm">Active</TabsTrigger>
          <TabsTrigger value="completed" className="text-xs sm:text-sm">Completed</TabsTrigger>
          <TabsTrigger value="join" className="text-xs sm:text-sm">Join</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-lg sm:text-xl font-semibold">Your Active Games</h2>
            <Button onClick={() => setIsCreateModalOpen(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Create Game
            </Button>
          </div>

          {activeGames.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <Gamepad2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600 mb-4">No active games</p>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  Create Your First Game
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {activeGames.map(renderGameCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 sm:space-y-6">
          <h2 className="text-lg sm:text-xl font-semibold">Completed Games</h2>

          {completedGames.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600">No completed games yet</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {completedGames.map(renderGameCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="join" className="space-y-4 sm:space-y-6">
          <div className="max-w-md mx-auto">
            <Card className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Join a Game</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                Enter the 6-character join code shared by the game host
              </p>

              <div className="space-y-4">
                <Input
                  placeholder="Enter join code (e.g., ABC123)"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="text-center text-2xl font-mono"
                />

                <Button 
                  className="w-full" 
                  onClick={handleJoinGame}
                  disabled={joiningGame || joinCode.length !== 6}
                >
                  {joiningGame ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <Gamepad2 className="h-4 w-4 mr-2" />
                      Join Game
                    </>
                  )}
                </Button>
              </div>
            </Card>

            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Join codes are case-insensitive and expire when the game starts.
                Ask the host for the code if you don't have it.
              </AlertDescription>
            </Alert>
          </div>
        </TabsContent>
      </Tabs>

      <CreateGameModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onGameCreated={(game) => {
          setIsCreateModalOpen(false)
          router.push(`/game/${game.id}/host`)
        }}
      />
    </>
  )
}