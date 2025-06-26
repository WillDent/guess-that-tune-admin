// ABOUTME: Games page showing all created games
// ABOUTME: Lists games with stats and management options
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
import { useGames } from '@/hooks/use-games'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/hooks/use-toast'
import { errorHandler } from '@/lib/errors/handler'
import { CreateGameModal } from '@/components/games/create-game-modal'
import { useRouter } from 'next/navigation'
import { GAME_STATUS } from '@/lib/constants/game-status'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function GamesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'join'>('active')
  const [joinCode, setJoinCode] = useState('')
  const [joiningGame, setJoiningGame] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  
  // Fetch active games
  const activeGames = useGames(GAME_STATUS.PENDING)
  const inProgressGames = useGames(GAME_STATUS.IN_PROGRESS)
  const completedGames = useGames(GAME_STATUS.COMPLETED)
  
  const allActiveGames = [
    ...(activeGames.games || []),
    ...(inProgressGames.games || [])
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const handleJoinGame = async () => {
    if (!joinCode.trim()) {
      toast.error('Please enter a game code')
      return
    }

    setJoiningGame(true)
    const { data, error } = await activeGames.joinGame(joinCode.toUpperCase())
    
    if (error) {
      const appError = errorHandler.handle(error)
      toast.error(errorHandler.getErrorMessage(appError))
    } else if (data) {
      toast.success('Successfully joined game!')
      router.push(`/games/${data.id}`)
    }
    
    setJoiningGame(false)
  }

  const handleStartGame = async (gameId: string) => {
    const { error } = await activeGames.updateGameStatus(gameId, GAME_STATUS.IN_PROGRESS)
    if (error) {
      const appError = errorHandler.handle(error)
      toast.error(errorHandler.getErrorMessage(appError))
    } else {
      router.push(`/games/${gameId}/play`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case GAME_STATUS.PENDING: return 'text-gray-600 border-gray-600'
      case GAME_STATUS.IN_PROGRESS: return 'text-blue-600 border-blue-600'
      case GAME_STATUS.COMPLETED: return 'text-green-600 border-green-600'
      default: return ''
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case GAME_STATUS.PENDING: return <Calendar className="h-4 w-4" />
      case GAME_STATUS.IN_PROGRESS: return <Gamepad2 className="h-4 w-4" />
      case GAME_STATUS.COMPLETED: return <Trophy className="h-4 w-4" />
      default: return null
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 border-green-600'
      case 'medium': return 'text-yellow-600 border-yellow-600'
      case 'hard': return 'text-red-600 border-red-600'
      default: return ''
    }
  }

  const copyGameCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Game code copied to clipboard!')
  }

  const GameCard = ({ game }: { game: any }) => (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{game.question_set?.name || 'Unnamed Game'}</h3>
          <p className="text-sm text-gray-600 mt-1">
            Created {new Date(game.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className={getStatusColor(game.status)}>
            <span className="flex items-center gap-1">
              {getStatusIcon(game.status)}
              {game.status.replace('_', ' ')}
            </span>
          </Badge>
          <Badge variant="outline" className={getDifficultyColor(game.question_set?.difficulty || 'medium')}>
            {game.question_set?.difficulty || 'medium'}
          </Badge>
        </div>
      </div>
      
      <div className="space-y-3 mb-4">
        {game.game_mode === 'multiplayer' && game.code && (
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Hash className="h-4 w-4 text-gray-500" />
              <span className="font-mono font-semibold text-lg">{game.code}</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyGameCode(game.code)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="h-4 w-4" />
            <span>{game.participant_count || 0} / {game.max_players} players</span>
          </div>
          
          {game.time_limit && (
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{game.time_limit}s per question</span>
            </div>
          )}
        </div>

        {game.status === 'completed' && game.ended_at && (
          <p className="text-sm text-gray-500">
            Ended {new Date(game.ended_at).toLocaleDateString()}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        {game.status === 'pending' && (
          <Button 
            size="sm" 
            className="flex-1"
            onClick={() => handleStartGame(game.id)}
          >
            <Play className="h-4 w-4 mr-1" />
            Start Game
          </Button>
        )}
        {game.status === 'in_progress' && (
          <Button 
            size="sm" 
            className="flex-1"
            onClick={() => router.push(`/games/${game.id}/play`)}
          >
            <Play className="h-4 w-4 mr-1" />
            Continue
          </Button>
        )}
        {game.status === 'completed' && (
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1"
            onClick={() => router.push(`/games/${game.id}/results`)}
          >
            <Trophy className="h-4 w-4 mr-1" />
            View Results
          </Button>
        )}
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => router.push(`/games/${game.id}`)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )

  const loading = activeGames.loading || inProgressGames.loading || completedGames.loading
  const error = activeGames.error || inProgressGames.error || completedGames.error

  return (
    <ProtectedRoute>
      <div>
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Games</h1>
            <p className="mt-2 text-gray-600">Create and manage your music quiz games</p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Game
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active">
              Active Games ({allActiveGames.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Past Games ({completedGames.games.length})
            </TabsTrigger>
            <TabsTrigger value="join">Join Game</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load games. Please try refreshing the page.
                </AlertDescription>
              </Alert>
            ) : allActiveGames.length === 0 ? (
              <Card className="p-12">
                <div className="text-center">
                  <Gamepad2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h2 className="text-xl font-semibold mb-2">No Active Games</h2>
                  <p className="text-gray-600 mb-6">
                    Create a new game or join an existing one to get started
                  </p>
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Game
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allActiveGames.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            {completedGames.loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : completedGames.games.length === 0 ? (
              <Card className="p-12">
                <div className="text-center">
                  <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h2 className="text-xl font-semibold mb-2">No Completed Games</h2>
                  <p className="text-gray-600">
                    Your completed games will appear here
                  </p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {completedGames.games.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="join" className="mt-6">
            <Card className="max-w-md mx-auto p-8">
              <div className="text-center mb-6">
                <Gamepad2 className="h-16 w-16 mx-auto mb-4 text-purple-600" />
                <h2 className="text-2xl font-semibold mb-2">Join a Game</h2>
                <p className="text-gray-600">
                  Enter the 6-character game code to join
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder="Enter game code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="text-center text-2xl font-mono tracking-wider"
                    maxLength={6}
                  />
                  <p className="text-sm text-gray-500 text-center mt-2">
                    Example: ABC123
                  </p>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleJoinGame}
                  disabled={joiningGame || joinCode.length !== 6}
                >
                  {joiningGame ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Joining...
                    </>
                  ) : (
                    'Join Game'
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <CreateGameModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onGameCreated={(game) => {
            setIsCreateModalOpen(false)
            router.push(`/games/${game.id}`)
          }}
        />
      </div>
    </ProtectedRoute>
  )
}