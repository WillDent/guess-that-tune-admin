// ABOUTME: Games page showing all created games
// ABOUTME: Lists games with stats and management options
'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Trophy, Calendar, Gamepad2 } from 'lucide-react'
import Link from 'next/link'
import type { QuestionSet } from '@/types'

interface Game {
  id: string
  name: string
  questionSetId: string
  questionSetName: string
  difficulty: string
  players: Array<{
    name: string
    score: number
  }>
  createdAt: string
  status: 'pending' | 'in-progress' | 'completed'
  winner?: string
  totalQuestions: number
}

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([])
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([])

  useEffect(() => {
    // Load games from localStorage
    const savedGames = JSON.parse(localStorage.getItem('games') || '[]')
    setGames(savedGames)

    // Load question sets to show available sets
    const savedQuestionSets = JSON.parse(localStorage.getItem('questionSets') || '[]')
    setQuestionSets(savedQuestionSets)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-gray-600 border-gray-600'
      case 'in-progress': return 'text-blue-600 border-blue-600'
      case 'completed': return 'text-green-600 border-green-600'
      default: return ''
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Calendar className="h-4 w-4" />
      case 'in-progress': return <Gamepad2 className="h-4 w-4" />
      case 'completed': return <Trophy className="h-4 w-4" />
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

  const createNewGame = () => {
    // For demo purposes, we'll create a sample game
    if (questionSets.length === 0) {
      alert('Please create a question set first!')
      return
    }

    const questionSet = questionSets[0]
    const newGame: Game = {
      id: Date.now().toString(),
      name: `Game ${games.length + 1}`,
      questionSetId: questionSet.id,
      questionSetName: questionSet.name,
      difficulty: questionSet.difficulty,
      players: [
        { name: 'Player 1', score: 0 },
        { name: 'Player 2', score: 0 }
      ],
      createdAt: new Date().toISOString(),
      status: 'pending',
      totalQuestions: questionSet.questionCount
    }

    const updatedGames = [...games, newGame]
    setGames(updatedGames)
    localStorage.setItem('games', JSON.stringify(updatedGames))
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Games</h1>
          <p className="mt-2 text-gray-600">Manage and track your music quiz games</p>
        </div>
        <Button onClick={createNewGame}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Game
        </Button>
      </div>

      {games.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Gamepad2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold mb-2">No Games Yet</h2>
            <p className="text-gray-600 mb-6">
              Create your first game using one of your question sets
            </p>
            {questionSets.length === 0 ? (
              <Link href="/questions">
                <Button>
                  Create Question Set First
                </Button>
              </Link>
            ) : (
              <Button onClick={createNewGame}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Game
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <Card key={game.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{game.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{game.questionSetName}</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className={getStatusColor(game.status)}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(game.status)}
                      {game.status}
                    </span>
                  </Badge>
                  <Badge variant="outline" className={getDifficultyColor(game.difficulty)}>
                    {game.difficulty}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">Players</span>
                  </div>
                  <div className="space-y-1">
                    {game.players.map((player, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span>{player.name}</span>
                        <span className="font-medium">{player.score} points</span>
                      </div>
                    ))}
                  </div>
                </div>

                {game.winner && (
                  <div className="flex items-center gap-2 text-sm">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span className="text-gray-600">Winner: <span className="font-medium">{game.winner}</span></span>
                  </div>
                )}

                <p className="text-sm text-gray-500">
                  Created {new Date(game.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex gap-2">
                {game.status === 'pending' && (
                  <Button size="sm" className="flex-1">
                    Start Game
                  </Button>
                )}
                {game.status === 'in-progress' && (
                  <Button size="sm" className="flex-1">
                    Continue
                  </Button>
                )}
                {game.status === 'completed' && (
                  <Button size="sm" variant="outline" className="flex-1">
                    View Results
                  </Button>
                )}
                <Button size="sm" variant="outline">
                  Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}