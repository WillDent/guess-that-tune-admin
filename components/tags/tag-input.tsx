'use client'

import { useState, useEffect, useRef } from 'react'
import { X, HelpCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { normalizeTag, validateTag } from '@/lib/tag-validation'

interface TagInputProps {
  tags: string[]
  onTagsChange: (tags: string[]) => void
  placeholder?: string
  maxTags?: number
  className?: string
  suggestions?: string[]
}

export function TagInput({
  tags,
  onTagsChange,
  placeholder = "Add tags (press Enter)",
  maxTags = 10,
  className,
  suggestions = []
}: TagInputProps) {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Fetch suggestions based on input
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!input.trim() || input.length < 2) {
        setShowSuggestions(false)
        return
      }

      setLoadingSuggestions(true)
      try {
        const response = await fetch(`/api/tags/suggestions?prefix=${encodeURIComponent(input)}&limit=5`)
        if (response.ok) {
          const data = await response.json()
          const filtered = data.suggestions
            .map((s: { tag: string }) => s.tag)
            .filter((tag: string) => !tags.includes(tag))
          setFilteredSuggestions(filtered)
          setShowSuggestions(filtered.length > 0)
        }
      } catch (err) {
        console.error('Failed to fetch tag suggestions:', err)
      } finally {
        setLoadingSuggestions(false)
      }
    }

    const debounceTimer = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(debounceTimer)
  }, [input, tags])

  // Handle clicks outside suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const [error, setError] = useState<string | null>(null)

  const addTag = (tag: string) => {
    const normalizedTag = normalizeTag(tag)
    const validation = validateTag(normalizedTag)
    
    if (!validation.valid) {
      setError(validation.error || 'Invalid tag')
      setTimeout(() => setError(null), 3000)
      return
    }
    
    if (tags.includes(normalizedTag)) {
      setError('Tag already added')
      setTimeout(() => setError(null), 3000)
      return
    }
    
    if (tags.length >= maxTags) {
      setError(`Maximum ${maxTags} tags allowed`)
      setTimeout(() => setError(null), 3000)
      return
    }
    
    onTagsChange([...tags, normalizedTag])
    setInput('')
    setShowSuggestions(false)
    setError(null)
  }

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (input.trim()) {
        addTag(input)
      }
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      // Remove last tag on backspace if input is empty
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Label htmlFor="tags">Tags</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                Add your own descriptive tags like "summer", "workout", or "party". 
                Tags help users find content based on mood, activity, or personal preferences.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="relative">
        <div className="flex flex-wrap gap-2 p-3 min-h-[42px] w-full rounded-md border border-input bg-background">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="cursor-pointer hover:bg-destructive/10"
              onClick={() => removeTag(tag)}
            >
              {tag}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}
          {tags.length < maxTags && (
            <Input
              ref={inputRef}
              id="tags"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(filteredSuggestions.length > 0)}
              placeholder={tags.length === 0 ? placeholder : ''}
              className="flex-1 min-w-[120px] border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          )}
        </div>

        {(showSuggestions || loadingSuggestions) && input.length >= 2 && (
          <div
            ref={suggestionsRef}
            className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md"
          >
            {loadingSuggestions ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Loading suggestions...
              </div>
            ) : filteredSuggestions.length > 0 ? (
              filteredSuggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground text-sm"
                  onClick={() => addTag(suggestion)}
                >
                  {suggestion}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No suggestions found
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-xs">
        <span className="text-muted-foreground">
          {tags.length}/{maxTags} tags
        </span>
        {error ? (
          <span className="text-destructive">{error}</span>
        ) : (
          <span className="text-muted-foreground">
            Tags are normalized: lowercase, alphanumeric + hyphens
          </span>
        )}
      </div>
    </div>
  )
}