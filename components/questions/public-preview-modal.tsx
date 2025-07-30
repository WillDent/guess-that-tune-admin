'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Music, Loader2 } from "lucide-react"
import { useQuestionSetDetails } from '@/hooks/use-question-set-details'
import type { QuestionSet, Question as QuestionType } from '@/types'

interface PublicPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  questionSet: QuestionSet | null
}

export function PublicPreviewModal({ isOpen, onClose, questionSet }: PublicPreviewModalProps) {
  const { questions, loading, error } = useQuestionSetDetails(isOpen ? questionSet?.id || null : null)
  const [transformedQuestions, setTransformedQuestions] = useState<QuestionType[]>([])

  useEffect(() => {
    if (questions.length > 0) {
      // Transform database questions to match QuestionSet type
      const transformed = questions.map(q => ({
        correctSong: {
          id: q.correct_song_id,
          name: q.correct_song_name,
          artist: q.correct_song_artist,
          album: q.correct_song_album || undefined,
          artwork: q.correct_song_artwork_url || undefined,
          previewUrl: q.correct_song_preview_url || undefined
        },
        detractors: Array.isArray(q.detractors) ? q.detractors : []
      }))
      setTransformedQuestions(transformed as QuestionType[])
    }
  }, [questions])

  if (!questionSet) return null

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 border-green-600'
      case 'medium': return 'text-yellow-600 border-yellow-600'
      case 'hard': return 'text-red-600 border-red-600'
      default: return ''
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto mx-2 sm:mx-auto">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
            {/* Artwork */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0">
              {questionSet.artwork_url ? (
                <img 
                  src={questionSet.artwork_url} 
                  alt={questionSet.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="h-8 w-8 sm:h-10 sm:w-10 text-white/80" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl sm:text-2xl">{questionSet.name}</DialogTitle>
                  <DialogDescription className="mt-2">
                    {questionSet.description || `Preview of ${questionSet.questionCount} questions`}
                  </DialogDescription>
                </div>
                <Badge variant="outline" className={getDifficultyColor(questionSet.difficulty)}>
                  {questionSet.difficulty}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">Failed to load questions</p>
              <p className="text-sm text-gray-500 mt-2">{error.message}</p>
            </div>
          ) : transformedQuestions.length === 0 ? (
            <div className="text-center py-12">
              <Music className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-600">No questions available</p>
            </div>
          ) : (
            transformedQuestions.map((question, idx) => (
              <div key={idx} className="border rounded-lg p-6 bg-gray-50">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold">Question {idx + 1}</h3>
                  <Badge className="bg-green-100 text-green-800 border-green-300">
                    Correct Answer
                  </Badge>
                </div>

                {/* Correct Answer */}
                <div className="mb-6">
                  <div className="flex items-center space-x-4 p-4 bg-white rounded-lg border-2 border-green-500">
                    {question.correctSong.artwork ? (
                      <img 
                        src={question.correctSong.artwork} 
                        alt={question.correctSong.album || ''}
                        className="w-16 h-16 rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Music className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-lg">{question.correctSong.name}</p>
                      <p className="text-gray-600">{question.correctSong.artist}</p>
                      {question.correctSong.album && (
                        <p className="text-sm text-gray-500">{question.correctSong.album}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Detractors */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Wrong Choices:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {question.detractors.map((detractor) => (
                      <div key={detractor.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
                        {detractor.artwork ? (
                          <img 
                            src={detractor.artwork} 
                            alt={detractor.album || detractor.name}
                            className="w-12 h-12 rounded flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                            <Music className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{detractor.name}</p>
                          <p className="text-xs text-gray-600 truncate">{detractor.artist}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}