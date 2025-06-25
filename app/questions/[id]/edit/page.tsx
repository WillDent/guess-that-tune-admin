// ABOUTME: Edit question set page for modifying existing sets
// ABOUTME: Allows changing name, difficulty, and regenerating questions
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Shuffle, AlertCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function EditQuestionSetPage() {
  const router = useRouter()
  const params = useParams()
  const questionSetId = params.id as string
  
  const [setName, setSetName] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [questions, setQuestions] = useState<any[]>([])
  const [originalSongIds, setOriginalSongIds] = useState<string[]>([])
  const [regenerating, setRegenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [notFound, setNotFound] = useState(false)

  // Load the question set
  useEffect(() => {
    const savedQuestionSets = JSON.parse(localStorage.getItem('questionSets') || '[]')
    const questionSet = savedQuestionSets.find((set: any) => set.id === questionSetId)
    
    if (!questionSet) {
      setNotFound(true)
      return
    }

    setSetName(questionSet.name)
    setDifficulty(questionSet.difficulty)
    setQuestions(questionSet.questions)
    
    // Extract original song IDs from the questions
    const songIds = questionSet.questions.map((q: any) => q.correctSong.id)
    setOriginalSongIds(songIds)
  }, [questionSetId])

  const regenerateQuestions = async () => {
    setRegenerating(true)
    try {
      const response = await fetch('/api/questions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedSongIds: originalSongIds,
          difficulty,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to regenerate questions')
      }

      const data = await response.json()
      setQuestions(data.questions)
    } catch (error) {
      console.error('Failed to regenerate questions:', error)
      alert('Failed to regenerate questions. Please try again.')
    } finally {
      setRegenerating(false)
    }
  }

  const handleSave = async () => {
    if (!setName.trim()) {
      alert('Please enter a name for the question set')
      return
    }

    setSaving(true)
    try {
      const savedQuestionSets = JSON.parse(localStorage.getItem('questionSets') || '[]')
      const updatedQuestionSets = savedQuestionSets.map((set: any) => {
        if (set.id === questionSetId) {
          return {
            ...set,
            name: setName,
            difficulty,
            questions,
            updatedAt: new Date().toISOString()
          }
        }
        return set
      })
      
      localStorage.setItem('questionSets', JSON.stringify(updatedQuestionSets))
      
      alert('Question set updated successfully!')
      router.push('/questions')
    } catch (error) {
      console.error('Failed to save question set:', error)
      alert('Failed to save question set. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (notFound) {
    return (
      <div>
        <Link href="/questions">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Questions
          </Button>
        </Link>

        <Card className="p-12">
          <div className="text-center">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Question Set Not Found</h2>
            <p className="text-gray-600 mb-6">
              The question set you're looking for doesn't exist.
            </p>
            <Link href="/questions">
              <Button>View All Question Sets</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/questions">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Questions
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Question Set</h1>
        <p className="mt-2 text-gray-600">
          Modify your question set configuration and questions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Set Name
                </label>
                <Input
                  value={setName}
                  onChange={(e) => setSetName(e.target.value)}
                  placeholder="e.g. 80s Rock Classics"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Difficulty
                </label>
                <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy - Very different songs</SelectItem>
                    <SelectItem value="medium">Medium - Similar genres</SelectItem>
                    <SelectItem value="hard">Hard - Very similar songs</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 space-y-2">
                <Button 
                  onClick={regenerateQuestions} 
                  disabled={regenerating}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {regenerating ? 'Regenerating...' : 'Regenerate Detractors'}
                </Button>
                
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </Card>

          {/* Question Stats */}
          <Card className="p-6 mt-6">
            <h3 className="font-semibold mb-4">Question Stats</h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Total Questions: <span className="font-medium">{questions.length}</span>
              </p>
              <p className="text-sm text-gray-600">
                Songs Used: <span className="font-medium">{originalSongIds.length}</span>
              </p>
              <p className="text-sm text-gray-600">
                Detractors per Question: <span className="font-medium">3</span>
              </p>
            </div>
          </Card>
        </div>

        {/* Questions Preview */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Questions Preview</h2>
              <Badge variant="outline" className="text-gray-600">
                {questions.length} Questions
              </Badge>
            </div>

            <div className="space-y-6">
              {questions.map((question, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-500">Q{idx + 1}</span>
                      {question.correctSong.artwork && (
                        <img 
                          src={question.correctSong.artwork} 
                          alt={question.correctSong.album}
                          className="w-12 h-12 rounded"
                        />
                      )}
                      <div>
                        <p className="font-medium">{question.correctSong.name}</p>
                        <p className="text-sm text-gray-600">{question.correctSong.artist}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Correct Answer
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                    {question.detractors.map((detractor: any) => (
                      <div key={detractor.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        {detractor.artwork && (
                          <img 
                            src={detractor.artwork} 
                            alt={detractor.album}
                            className="w-10 h-10 rounded flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{detractor.name}</p>
                          <p className="text-xs text-gray-600 truncate">{detractor.artist}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}