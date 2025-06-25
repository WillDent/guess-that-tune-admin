// ABOUTME: Questions page showing all created question sets
// ABOUTME: Lists question sets with preview and management options
'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Play, Trash2, Music } from 'lucide-react'
import Link from 'next/link'
import { PreviewModal } from '@/components/questions/preview-modal'
import type { QuestionSet } from '@/types'

export default function QuestionsPage() {
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([])
  const [previewSet, setPreviewSet] = useState<QuestionSet | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  useEffect(() => {
    // Load question sets from localStorage
    const savedQuestionSets = JSON.parse(localStorage.getItem('questionSets') || '[]')
    setQuestionSets(savedQuestionSets)
  }, [])

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this question set?')) {
      const updatedSets = questionSets.filter((set) => set.id !== id)
      setQuestionSets(updatedSets)
      localStorage.setItem('questionSets', JSON.stringify(updatedSets))
    }
  }

  const handlePreview = (set: QuestionSet) => {
    setPreviewSet(set)
    setIsPreviewOpen(true)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 border-green-600'
      case 'medium': return 'text-yellow-600 border-yellow-600'
      case 'hard': return 'text-red-600 border-red-600'
      default: return ''
    }
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Question Sets</h1>
          <p className="mt-2 text-gray-600">Manage your question collections for games</p>
        </div>
        <Link href="/questions/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create New Set
          </Button>
        </Link>
      </div>

      {questionSets.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Music className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold mb-2">No Question Sets Yet</h2>
            <p className="text-gray-600 mb-6">
              Create your first question set by selecting songs from Apple Music
            </p>
            <Link href="/browse">
              <Button>
                <Music className="h-4 w-4 mr-2" />
                Browse Music
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {questionSets.map((set) => (
            <Card key={set.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">{set.name}</h3>
                <Badge variant="outline" className={getDifficultyColor(set.difficulty)}>
                  {set.difficulty}
                </Badge>
              </div>
              
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{set.questionCount}</span> questions
                </p>
                <p className="text-sm text-gray-600">
                  Played <span className="font-medium">{set.playCount}</span> times
                </p>
                <p className="text-sm text-gray-500">
                  Created {new Date(set.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handlePreview(set)}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Preview
                </Button>
                <Link href={`/questions/${set.id}/edit`}>
                  <Button size="sm" variant="outline" className="flex-1">
                    Edit
                  </Button>
                </Link>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-red-600"
                  onClick={() => handleDelete(set.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false)
          setPreviewSet(null)
        }}
        questionSet={previewSet}
      />
    </div>
  )
}