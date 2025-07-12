// ABOUTME: Modal component for previewing question sets with all questions and detractors
// ABOUTME: Shows detailed view of each question with correct answer and wrong choices
'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Music, X } from "lucide-react"
import type { QuestionSet } from '@/types'

interface PreviewModalProps {
  isOpen: boolean
  onClose: () => void
  questionSet: QuestionSet | null
}

export function PreviewModal({ isOpen, onClose, questionSet }: PreviewModalProps) {
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
                    Preview of {questionSet.questions.length} questions
                  </DialogDescription>
                </div>
                <Badge variant="outline" className={getDifficultyColor(questionSet.difficulty)}>
                  {questionSet.difficulty}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
          {questionSet.questions.map((question, idx) => (
            <div key={idx} className="border rounded-lg p-4 sm:p-6 bg-gray-50">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold">Question {idx + 1}</h3>
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  Correct Answer
                </Badge>
              </div>

              {/* Correct Answer */}
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-white rounded-lg border-2 border-green-500">
                  {question.correctSong.artwork ? (
                    <img 
                      src={question.correctSong.artwork} 
                      alt={question.correctSong.album}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg"
                    />
                  ) : (
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Music className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-sm sm:text-lg">{question.correctSong.name}</p>
                    <p className="text-xs sm:text-base text-gray-600">{question.correctSong.artist}</p>
                    {question.correctSong.album && (
                      <p className="text-sm text-gray-500">{question.correctSong.album}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Detractors */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2 sm:mb-3">Wrong Choices:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                  {question.detractors.map((detractor) => (
                    <div key={detractor.id} className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-white rounded-lg border">
                      {detractor.artwork ? (
                        <img 
                          src={detractor.artwork} 
                          alt={detractor.album || detractor.name}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                          <Music className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium truncate">{detractor.name}</p>
                        <p className="text-xs text-gray-600 truncate">{detractor.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>
            Close Preview
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}