'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Trophy, 
  Medal,
  Star,
  Users,
  RotateCw,
  Home,
  BarChart,
  Target,
  Zap
} from 'lucide-react'
import { useGameRoom } from '@/hooks/use-game-room'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { cn } from '@/lib/utils'
import confetti from 'canvas-confetti'

interface GameResultsProps {
  gameId: string
}

export function GameResults({ gameId }: GameResultsProps) {
  const router = useRouter()
  const {
    game,
    players,
    questions,
    loading
  } = useGameRoom(gameId)
  
  const [showConfetti, setShowConfetti] = useState(true)
  
  // Sort players by score
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)
  const winner = sortedPlayers[0]
  
  // Calculate statistics
  const totalQuestions = questions.length
  const averageScore = players.reduce((sum, p) => sum + p.score, 0) / players.length
  
  // Trigger confetti for winner
  if (showConfetti && winner && !loading) {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })
    setShowConfetti(false)
  }
  
  const getPlayerStats = (player: typeof players[0]) => {
    const correctAnswers = player.answers?.filter(a => a.is_correct).length || 0
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0
    const avgTimePerAnswer = player.answers?.length 
      ? player.answers.reduce((sum, a) => sum + (a.time_taken || 0), 0) / player.answers.length 
      : 0
      
    return {
      correctAnswers,
      accuracy,
      avgTime: avgTimePerAnswer.toFixed(1)
    }
  }
  
  const getMedalIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Trophy className="h-8 w-8 text-yellow-500" />
      case 1:
        return <Medal className="h-8 w-8 text-gray-400" />
      case 2:
        return <Medal className="h-8 w-8 text-orange-600" />
      default:
        return null
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Winner Announcement */}
      <Card className="p-8 text-center bg-gradient-to-r from-purple-600 to-purple-700 text-white">
        <Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-400" />
        <h1 className="text-3xl font-bold mb-2">Game Over!</h1>
        <p className="text-xl">
          🎉 {winner?.display_name} wins with {winner?.score} points! 🎉
        </p>
      </Card>
      
      {/* Leaderboard */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <Users className="h-6 w-6" />
          Final Leaderboard
        </h2>
        
        <div className="space-y-3">
          {sortedPlayers.map((player, index) => {
            const stats = getPlayerStats(player)
            const isWinner = index === 0
            
            return (
              <div
                key={player.id}
                className={cn(
                  "relative p-4 rounded-lg border-2 transition-all",
                  isWinner 
                    ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20" 
                    : "border-gray-200 dark:border-gray-700"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getMedalIcon(index)}
                      <span className="text-2xl font-bold text-gray-500">
                        #{index + 1}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                        <span className="text-lg font-semibold text-purple-600 dark:text-purple-300">
                          {player.display_name[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-lg flex items-center gap-2">
                          {player.display_name}
                          {isWinner && <Star className="h-5 w-5 text-yellow-500" />}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            {stats.accuracy.toFixed(0)}% accuracy
                          </span>
                          <span className="flex items-center gap-1">
                            <Zap className="h-4 w-4" />
                            {stats.avgTime}s avg
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-3xl font-bold">{player.score}</p>
                    <p className="text-sm text-gray-600">
                      {stats.correctAnswers}/{totalQuestions} correct
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
      
      {/* Game Stats */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <BarChart className="h-5 w-5" />
          Game Statistics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{totalQuestions}</p>
            <p className="text-sm text-gray-600">Questions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{players.length}</p>
            <p className="text-sm text-gray-600">Players</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{averageScore.toFixed(1)}</p>
            <p className="text-sm text-gray-600">Avg Score</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">30s</p>
            <p className="text-sm text-gray-600">Per Question</p>
          </div>
        </div>
      </Card>
      
      {/* Actions */}
      <div className="flex gap-4">
        <Button
          size="lg"
          variant="outline"
          className="flex-1"
          onClick={() => router.push('/games')}
        >
          <Home className="h-5 w-5 mr-2" />
          Back to Games
        </Button>
        <Button
          size="lg"
          className="flex-1"
          onClick={() => router.push('/games')}
        >
          <RotateCw className="h-5 w-5 mr-2" />
          Play Again
        </Button>
      </div>
    </div>
  )
}