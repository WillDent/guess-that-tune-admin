'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { AlertCircle, Download, Sparkles } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { errorHandler } from '@/lib/errors/handler'

interface AIPromptTestModalProps {
  isOpen: boolean
  onClose: () => void
  prompt: {
    id: string
    name: string
    prompt_template: string
    variables: string[]
    style: string
    color_scheme: string
  }
}

interface TestVariables {
  [key: string]: string
}

const defaultVariables: TestVariables = {
  style_description: 'artistic painterly style with brush strokes',
  color_description: 'bright vibrant colors with high contrast',
  theme_context: 'Modern music collection.',
  visual_elements: 'Include musical notes, instruments, rhythmic patterns.',
  artists: 'Various Artists',
  genres: 'Pop, Rock',
  song_count: '10',
  game_type: 'guess_artist'
}

export function AIPromptTestModal({ isOpen, onClose, prompt }: AIPromptTestModalProps) {
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [userTheme, setUserTheme] = useState('')
  const [testSongs, setTestSongs] = useState(`Song 1 - Artist 1
Song 2 - Artist 2
Song 3 - Artist 3`)
  const [variables, setVariables] = useState<TestVariables>(defaultVariables)
  const [expandedPrompt, setExpandedPrompt] = useState('')

  // Update expanded prompt when variables change
  const updateExpandedPrompt = () => {
    let expanded = prompt.prompt_template
    Object.entries(variables).forEach(([key, value]) => {
      expanded = expanded.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
    })
    setExpandedPrompt(expanded)
  }

  // Update expanded prompt when variables or prompt changes
  useEffect(() => {
    updateExpandedPrompt()
  }, [variables, prompt])

  const handleGenerate = async () => {
    setIsGenerating(true)
    setGeneratedImageUrl(null)

    try {
      // Parse test songs
      const songs = testSongs.split('\n').filter(line => line.trim()).map((line, index) => {
        const [name, artist] = line.split(' - ').map(s => s.trim())
        return {
          id: `test-${index}`,
          name: name || `Song ${index + 1}`,
          artist: artist || 'Unknown Artist'
        }
      })

      if (songs.length === 0) {
        throw new Error('Please provide at least one song')
      }

      // Update prompt with current variables
      updateExpandedPrompt()

      const response = await fetch('/api/admin/ai-prompts/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptId: prompt.id,
          songs,
          userTheme,
          testVariables: variables,
          style: prompt.style,
          colorScheme: prompt.color_scheme
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate test image')
      }

      const data = await response.json()
      setGeneratedImageUrl(data.imageUrl)
      toast.success('Test image generated successfully!')
    } catch (error) {
      console.error('Error generating test image:', error)
      const appError = errorHandler.handle(error)
      toast.error(errorHandler.getErrorMessage(appError))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async () => {
    if (!generatedImageUrl) return

    try {
      const response = await fetch(generatedImageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ai-artwork-test-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading image:', error)
      toast.error('Failed to download image')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Test AI Prompt: {prompt.name}</DialogTitle>
          <DialogDescription>
            Test your prompt with sample data before using it in production
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Test Songs */}
          <div>
            <Label htmlFor="test-songs">Test Songs</Label>
            <Textarea
              id="test-songs"
              value={testSongs}
              onChange={(e) => setTestSongs(e.target.value)}
              rows={3}
              placeholder="Song Name - Artist Name (one per line)"
              className="font-mono text-sm"
            />
            <p className="text-sm text-gray-600 mt-1">
              Enter test songs in format: Song Name - Artist Name
            </p>
          </div>

          {/* User Theme */}
          <div>
            <Label htmlFor="user-theme">Additional Theme (Optional)</Label>
            <Input
              id="user-theme"
              value={userTheme}
              onChange={(e) => setUserTheme(e.target.value)}
              placeholder="e.g., 'retro vibes', 'summer playlist'"
            />
          </div>

          {/* Variables */}
          {prompt.variables.length > 0 && (
            <div>
              <Label>Template Variables</Label>
              <div className="space-y-3 mt-2">
                {prompt.variables.map((variable) => (
                  <div key={variable}>
                    <Label htmlFor={`var-${variable}`} className="text-sm">
                      {variable.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Label>
                    <Input
                      id={`var-${variable}`}
                      value={variables[variable] || ''}
                      onChange={(e) => {
                        setVariables({ ...variables, [variable]: e.target.value })
                      }}
                      placeholder={`Enter ${variable}`}
                      className="mt-1"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expanded Prompt Preview */}
          <div>
            <Label>Expanded Prompt Preview</Label>
            <div className="bg-gray-50 p-4 rounded-md mt-2">
              <pre className="text-sm whitespace-pre-wrap font-mono">
                {expandedPrompt || prompt.prompt_template}
              </pre>
            </div>
          </div>

          {/* Generate Button */}
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Generating Test Image...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Test Image
              </>
            )}
          </Button>

          {/* Generated Image */}
          {generatedImageUrl && (
            <div className="space-y-4">
              <div className="relative aspect-square max-w-md mx-auto">
                <img
                  src={generatedImageUrl}
                  alt="Generated test artwork"
                  className="w-full h-full object-cover rounded-lg shadow-lg"
                />
              </div>
              <div className="flex justify-center">
                <Button onClick={handleDownload} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Image
                </Button>
              </div>
            </div>
          )}

          {/* Rate Limit Warning */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Test generations count towards your daily AI artwork limit. 
              Free users: 3/day, Pro users: 20/day.
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  )
}