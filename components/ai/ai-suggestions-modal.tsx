'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Sparkles, RefreshCw, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { errorHandler } from '@/lib/errors/handler'

interface AISuggestionsModalProps {
  isOpen: boolean
  onClose: () => void
  onAccept: (name: string, description: string) => void
  songs: Array<{
    id: string
    name: string
    artist: string
    album?: string
    genre?: string
  }>
  gameType: 'guess_artist' | 'guess_song'
  difficulty: 'easy' | 'medium' | 'hard'
}

export function AISuggestionsModal({
  isOpen,
  onClose,
  onAccept,
  songs,
  gameType,
  difficulty
}: AISuggestionsModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<{
    names: string[]
    description: string
  } | null>(null)
  const [selectedName, setSelectedName] = useState<string>('')
  const [editedDescription, setEditedDescription] = useState<string>('')
  const [remainingRequests, setRemainingRequests] = useState<number | null>(null)

  const generateSuggestions = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai/question-set-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          songs,
          gameType,
          difficulty
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate suggestions')
      }

      const data = await response.json()
      setSuggestions({
        names: data.names,
        description: data.description
      })
      setEditedDescription(data.description)
      setSelectedName(data.names[0] || '')
      setRemainingRequests(data.remaining)
    } catch (error) {
      const appError = errorHandler.handle(error)
      toast.error(errorHandler.getErrorMessage(appError))
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = () => {
    if (selectedName && editedDescription) {
      onAccept(selectedName, editedDescription)
      onClose()
    }
  }

  // Generate suggestions when modal opens
  useEffect(() => {
    if (isOpen && !suggestions && !loading) {
      generateSuggestions()
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI-Generated Suggestions
          </DialogTitle>
          <DialogDescription>
            Based on your {songs.length} selected songs, here are some suggestions for your question set.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-gray-600 mt-4">Analyzing your songs and generating suggestions...</p>
          </div>
        ) : suggestions ? (
          <div className="space-y-6">
            {/* Name Suggestions */}
            <div>
              <h3 className="text-sm font-medium mb-3">Choose a name for your question set:</h3>
              <div className="space-y-2">
                {suggestions.names.map((name, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedName(name)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedName === name
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{name}</span>
                      {selectedName === name && (
                        <Check className="h-4 w-4 text-purple-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-medium mb-3">Description (you can edit this):</h3>
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="min-h-[100px]"
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">
                {editedDescription.length}/200 characters
              </p>
            </div>

            {/* Rate Limit Info */}
            {remainingRequests !== null && (
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>AI suggestions remaining this hour: {remainingRequests}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={generateSuggestions}
                disabled={loading || remainingRequests === 0}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAccept}
                  disabled={!selectedName || !editedDescription}
                >
                  Use These Suggestions
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">Failed to load suggestions.</p>
            <Button 
              variant="outline" 
              onClick={generateSuggestions} 
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}