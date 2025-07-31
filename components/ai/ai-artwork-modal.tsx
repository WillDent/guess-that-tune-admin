'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Sparkles, RefreshCw, Download, Palette, Brush, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { errorHandler } from '@/lib/errors/handler'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client'

interface AIArtworkModalProps {
  isOpen: boolean
  onClose: () => void
  onAccept: (imageUrl: string) => void
  songs: Array<{
    id: string
    name: string
    artist: string
    album?: string
    genre?: string
  }>
  gameType: 'guess_artist' | 'guess_song'
}

type StyleOption = 'abstract' | 'realistic' | 'artistic' | 'minimalist'
type ColorOption = 'vibrant' | 'dark' | 'pastel' | 'monochrome'

const styleLabels: Record<StyleOption, string> = {
  abstract: 'Abstract',
  realistic: 'Realistic',
  artistic: 'Artistic',
  minimalist: 'Minimalist'
}

const colorLabels: Record<ColorOption, string> = {
  vibrant: 'Vibrant',
  dark: 'Dark',
  pastel: 'Pastel',
  monochrome: 'Monochrome'
}

export function AIArtworkModal({
  isOpen,
  onClose,
  onAccept,
  songs,
  gameType
}: AIArtworkModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [style, setStyle] = useState<StyleOption>('artistic')
  const [colorScheme, setColorScheme] = useState<ColorOption>('vibrant')
  const [userTheme, setUserTheme] = useState('')
  const [remainingGenerations, setRemainingGenerations] = useState<number | null>(null)
  const [prompts, setPrompts] = useState<any[]>([])
  const [selectedPromptId, setSelectedPromptId] = useState<string>('default')
  const [loadingPrompts, setLoadingPrompts] = useState(false)
  const supabase = createSupabaseBrowserClient()

  // Fetch available prompts
  useEffect(() => {
    const fetchPrompts = async () => {
      if (!isOpen) return
      
      setLoadingPrompts(true)
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await (supabase as any)
          .from('ai_artwork_prompts')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('is_default', { ascending: false })
          .order('name')

        if (!error && data) {
          // If user has no prompts, initialize them
          if (data.length === 0) {
            const initResponse = await fetch('/api/user/init-prompts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            })
            
            if (initResponse.ok) {
              // Refetch prompts after initialization
              const { data: newPrompts } = await (supabase as any)
                .from('ai_artwork_prompts')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .order('is_default', { ascending: false })
                .order('name')
              
              if (newPrompts) {
                setPrompts(newPrompts)
                const defaultPrompt = newPrompts.find((p: any) => p.is_default)
                if (defaultPrompt) {
                  setSelectedPromptId(defaultPrompt.id)
                  setStyle(defaultPrompt.style)
                  setColorScheme(defaultPrompt.color_scheme)
                }
              }
            }
          } else {
            setPrompts(data)
            // Select default prompt if available
            const defaultPrompt = data.find((p: any) => p.is_default)
            if (defaultPrompt) {
              setSelectedPromptId(defaultPrompt.id)
              setStyle(defaultPrompt.style)
              setColorScheme(defaultPrompt.color_scheme)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching prompts:', error)
      } finally {
        setLoadingPrompts(false)
      }
    }

    fetchPrompts()
  }, [isOpen])

  // Update style/color when prompt changes
  const handlePromptChange = (promptId: string) => {
    setSelectedPromptId(promptId)
    if (promptId !== 'default') {
      const prompt = prompts.find(p => p.id === promptId)
      if (prompt) {
        setStyle(prompt.style)
        setColorScheme(prompt.color_scheme)
      }
    }
  }

  const generateArtwork = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai/generate-artwork', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          songs,
          gameType,
          style,
          colorScheme,
          userTheme: userTheme.trim() || undefined,
          promptId: selectedPromptId !== 'default' ? selectedPromptId : undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate artwork')
      }

      const data = await response.json()
      setImageUrl(data.imageUrl)
      setRemainingGenerations(data.remaining)
      
      console.log('[AI Artwork Modal] Generated artwork:', data.imageUrl)
      console.log('[AI Artwork Modal] Prompt used:', data.prompt)
      
    } catch (error) {
      const appError = errorHandler.handle(error)
      toast.error(errorHandler.getErrorMessage(appError))
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = () => {
    if (imageUrl) {
      onAccept(imageUrl)
      handleClose()
    }
  }

  const handleClose = () => {
    // Reset state when closing
    setImageUrl(null)
    setUserTheme('')
    onClose()
  }

  const handleRegenerate = () => {
    setImageUrl(null)
    generateArtwork()
  }

  // Removed auto-generation to allow users to select options first

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI Artwork Generation
          </DialogTitle>
          <DialogDescription>
            Create custom artwork for your question set based on the selected songs.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-gray-600 mt-4">Creating your artwork...</p>
            <p className="text-xs text-gray-500 mt-2">This may take up to 20 seconds</p>
          </div>
        ) : imageUrl ? (
          <div className="space-y-4">
            {/* Generated Image Preview */}
            <div className="relative rounded-lg overflow-hidden bg-gray-100">
              <img 
                src={imageUrl} 
                alt="Generated artwork"
                className="w-full h-auto"
              />
              <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                AI Generated
              </div>
            </div>

            {/* Generation Info */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Based on {songs.length} songs</span>
              {remainingGenerations !== null && (
                <span>Generations remaining today: {remainingGenerations}</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handleRegenerate}
                disabled={remainingGenerations === 0}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleAccept}>
                  <Download className="h-4 w-4 mr-2" />
                  Use This Artwork
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Prompt Selection */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Prompt Template
              </label>
              <Select 
                value={selectedPromptId} 
                onValueChange={handlePromptChange}
                disabled={loadingPrompts}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingPrompts ? "Loading prompts..." : "Select a prompt"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default (Built-in)</SelectItem>
                  {prompts.map((prompt) => (
                    <SelectItem key={prompt.id} value={prompt.id}>
                      {prompt.name}
                      {prompt.is_default && ' ⭐'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPromptId !== 'default' && (
                <p className="text-xs text-gray-500 mt-1">
                  {prompts.find(p => p.id === selectedPromptId)?.description}
                </p>
              )}
            </div>

            {/* Style Options */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Brush className="h-4 w-4" />
                  Art Style
                </label>
                <Select 
                  value={style} 
                  onValueChange={(v: StyleOption) => setStyle(v)}
                  disabled={selectedPromptId !== 'default'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(styleLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Color Scheme
                </label>
                <Select 
                  value={colorScheme} 
                  onValueChange={(v: ColorOption) => setColorScheme(v)}
                  disabled={selectedPromptId !== 'default'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(colorLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedPromptId !== 'default' && (
                <p className="text-xs text-gray-500">
                  Style and color are controlled by the selected prompt template
                </p>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  Additional Theme (optional)
                </label>
                <Textarea
                  value={userTheme}
                  onChange={(e) => setUserTheme(e.target.value)}
                  placeholder="E.g., 'summer festival vibes', 'retro arcade', 'nature inspired'..."
                  rows={2}
                  className="text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Add specific themes or moods to guide the artwork generation
                </p>
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={generateArtwork} disabled={songs.length === 0}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Artwork
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}