'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Music, 
  Clock, 
  Users,
  Check,
  X,
  PlayCircle,
  PauseCircle,
  Volume2,
  VolumeX
} from 'lucide-react'
import { useGameRoom } from '@/hooks/use-game-room'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'
import { GAME_TYPES } from '@/types/game-type'

interface GamePlayProps {
  gameId: string
}

interface AnswerOption {
  id: string
  name: string
  artist: string
  artwork?: string
}

export function GamePlay({ gameId }: GamePlayProps) {
  const { user } = useAuth()
  const {
    game,
    players,
    currentQuestion,
    currentQuestionIndex,
    questions,
    timeRemaining,
    submitAnswer,
    loading
  } = useGameRoom(gameId)
  
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  
  // Get current player
  const currentPlayer = players.find(p => p.user_id === user?.id)
  const currentPlayerAnswer = currentPlayer?.answers?.find(
    a => a.question_index === currentQuestionIndex
  )
  
  // Get game type - for now default to GUESS_ARTIST
  // TODO: Fetch game type from question set if needed
  const gameType = GAME_TYPES.GUESS_ARTIST
  
  // Prepare answer options based on game type
  const answerOptions: AnswerOption[] = currentQuestion ? [
    {
      id: currentQuestion.correct_song_id,
      name: gameType === GAME_TYPES.GUESS_SONG 
        ? currentQuestion.correct_song_name 
        : currentQuestion.correct_song_artist,
      artist: gameType === GAME_TYPES.GUESS_SONG
        ? currentQuestion.correct_song_artist
        : '',
      artwork: currentQuestion.correct_song_artwork_url || undefined
    },
    ...(currentQuestion.detractors as any[] || []).map((d: any) => ({
      id: d.id,
      name: gameType === GAME_TYPES.GUESS_SONG ? d.name : d.artist,
      artist: gameType === GAME_TYPES.GUESS_SONG ? d.artist : '',
      artwork: d.artwork
    }))
  ].sort(() => Math.random() - 0.5) : []
  
  // Handle audio preview
  useEffect(() => {
    if (currentQuestion?.correct_song_preview_url) {
      const audio = new Audio(currentQuestion.correct_song_preview_url)
      audio.volume = isMuted ? 0 : 0.5
      setAudioElement(audio)
      
      return () => {
        audio.pause()
        audio.src = ''
      }
    }
  }, [currentQuestion, isMuted])
  
  useEffect(() => {
    if (audioElement) {
      audioElement.volume = isMuted ? 0 : 0.5
    }
  }, [isMuted, audioElement])
  
  const togglePlayPause = () => {
    if (!audioElement) return
    
    if (isPlaying) {
      audioElement.pause()
    } else {
      audioElement.play()
    }
    setIsPlaying(!isPlaying)
  }
  
  const toggleMute = () => {
    setIsMuted(!isMuted)
  }
  
  // Auto-play when question changes
  useEffect(() => {
    if (audioElement && !hasAnswered) {
      audioElement.play()
      setIsPlaying(true)
    }
  }, [audioElement, hasAnswered])
  
  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer(null)
    setHasAnswered(false)
    setShowResult(false)
  }, [currentQuestionIndex])
  
  // Check if already answered
  useEffect(() => {
    if (currentPlayerAnswer) {
      setSelectedAnswer(currentPlayerAnswer.selected_answer)
      setHasAnswered(true)
      setShowResult(true)
    }
  }, [currentPlayerAnswer])
  
  const handleAnswerSelect = (answerId: string) => {
    if (hasAnswered) return
    setSelectedAnswer(answerId)
  }
  
  const handleSubmitAnswer = async () => {
    if (!selectedAnswer || hasAnswered) return
    
    setHasAnswered(true)
    await submitAnswer(selectedAnswer)
    
    // Show result after submission
    setTimeout(() => {
      setShowResult(true)
      if (audioElement) {
        audioElement.pause()
        setIsPlaying(false)
      }
    }, 500)
  }
  
  // Calculate progress
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100
  const timeProgress = (timeRemaining / (game?.time_limit || 30)) * 100
  
  // Get players who have answered
  const answeredPlayers = players.filter(p => 
    p.answers?.some(a => a.question_index === currentQuestionIndex)
  )
  
  if (loading || !currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Game Progress */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <span className="text-sm text-gray-600">
            {answeredPlayers.length}/{players.length} answered
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </Card>
      
      {/* Timer and Controls */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span className="text-2xl font-bold font-mono">
                {timeRemaining}s
              </span>
            </div>
            <Progress value={timeProgress} className="w-32 h-2" />
          </div>
          
          {currentQuestion.correct_song_preview_url && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={togglePlayPause}
                disabled={hasAnswered}
              >
                {isPlaying ? (
                  <PauseCircle className="h-5 w-5" />
                ) : (
                  <PlayCircle className="h-5 w-5" />
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={toggleMute}
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
            </div>
          )}
        </div>
        
        <div className="text-center mb-6">
          <Music className="h-12 w-12 mx-auto mb-3 text-purple-600" />
          <h2 className="text-xl font-semibold">
            {hasAnswered && showResult 
              ? gameType === GAME_TYPES.GUESS_SONG
                ? `The song was: ${currentQuestion.correct_song_name}`
                : `The artist was: ${currentQuestion.correct_song_artist}`
              : gameType === GAME_TYPES.GUESS_SONG
                ? 'Name this song!'
                : 'Name the artist!'
            }
          </h2>
          {hasAnswered && showResult && gameType === GAME_TYPES.GUESS_SONG && (
            <p className="text-gray-600 mt-1">
              by {currentQuestion.correct_song_artist}
            </p>
          )}
        </div>
        
        {/* Answer Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {answerOptions.map((option) => {
            const isCorrect = option.id === currentQuestion.correct_song_id
            const isSelected = option.id === selectedAnswer
            const showCorrect = showResult && isCorrect
            const showIncorrect = showResult && isSelected && !isCorrect
            
            return (
              <button
                key={option.id}
                onClick={() => handleAnswerSelect(option.id)}
                disabled={hasAnswered}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-lg border-2 transition-all",
                  "hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20",
                  isSelected && !showResult && "border-purple-500 bg-purple-50 dark:bg-purple-900/20",
                  showCorrect && "border-green-500 bg-green-50 dark:bg-green-900/20",
                  showIncorrect && "border-red-500 bg-red-50 dark:bg-red-900/20",
                  !isSelected && !showResult && "border-gray-200 dark:border-gray-700",
                  hasAnswered && "cursor-not-allowed opacity-75"
                )}
              >
                {option.artwork && (
                  <img
                    src={option.artwork}
                    alt={option.name}
                    className="w-12 h-12 rounded flex-shrink-0"
                  />
                )}
                <div className="flex-1 text-left">
                  <p className="font-medium">{option.name}</p>
                  {gameType === GAME_TYPES.GUESS_SONG && option.artist && (
                    <p className="text-sm text-gray-600">{option.artist}</p>
                  )}
                </div>
                {showCorrect && <Check className="h-5 w-5 text-green-600" />}
                {showIncorrect && <X className="h-5 w-5 text-red-600" />}
              </button>
            )
          })}
        </div>
        
        {/* Submit Button */}
        {!hasAnswered && (
          <Button
            size="lg"
            className="w-full"
            onClick={handleSubmitAnswer}
            disabled={!selectedAnswer}
          >
            Submit Answer
          </Button>
        )}
        
        {hasAnswered && !showResult && (
          <div className="text-center">
            <LoadingSpinner size="sm" />
            <p className="text-sm text-gray-600 mt-2">Submitting answer...</p>
          </div>
        )}
        
        {hasAnswered && showResult && (
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Waiting for next question...
            </p>
          </div>
        )}
      </Card>
      
      {/* Live Scores */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Live Scores
        </h3>
        <div className="space-y-2">
          {players
            .sort((a, b) => b.score - a.score)
            .map((player, index) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-gray-500">
                    #{index + 1}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <span className="text-sm font-semibold text-purple-600 dark:text-purple-300">
                      {player.display_name[0]?.toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium">{player.display_name}</span>
                </div>
                <div className="flex items-center gap-3">
                  {player.answers?.some(a => a.question_index === currentQuestionIndex) && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <Check className="h-3 w-3" />
                    </Badge>
                  )}
                  <span className="font-bold text-lg">{player.score}</span>
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  )
}