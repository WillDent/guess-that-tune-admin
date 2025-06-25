// ABOUTME: Modal component for previewing question sets with all questions and detractors
// ABOUTME: Shows detailed view of each question with correct answer and wrong choices
'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Music, X } from "lucide-react"

interface PreviewModalProps {
  isOpen: boolean
  onClose: () => void
  questionSet: {
    id: string
    name: string
    difficulty: string
    questions: Array<{
      correctSong: {
        id: string
        name: string
        artist: string
        album: string
        artwork?: string
      }
      detractors: Array<{
        id: string
        name: string
        artist: string
        album: string
        artwork?: string
      }>
    }>
  } | null
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
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{questionSet.name}</DialogTitle>
              <DialogDescription className="mt-2">
                Preview of {questionSet.questions.length} questions
              </DialogDescription>
            </div>
            <Badge variant="outline" className={getDifficultyColor(questionSet.difficulty)}>
              {questionSet.difficulty}
            </Badge>
          </div>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          {questionSet.questions.map((question, idx) => (
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
                      alt={question.correctSong.album}
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
                    <p className="text-sm text-gray-500">{question.correctSong.album}</p>
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
                          alt={detractor.album}
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