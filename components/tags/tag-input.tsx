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
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Filter suggestions based on input
  useEffect(() => {
    if (input.trim()) {
      const filtered = suggestions
        .filter(s => 
          s.toLowerCase().includes(input.toLowerCase()) && 
          !tags.includes(s)
        )
        .slice(0, 5)
      setFilteredSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }, [input, suggestions, tags])

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

  const normalizeTag = (tag: string): string => {
    return tag
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-\s]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 30)
  }

  const addTag = (tag: string) => {
    const normalizedTag = normalizeTag(tag)
    
    if (
      normalizedTag.length >= 2 &&
      !tags.includes(normalizedTag) &&
      tags.length < maxTags
    ) {
      onTagsChange([...tags, normalizedTag])
      setInput('')
      setShowSuggestions(false)
    }
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

        {showSuggestions && (
          <div
            ref={suggestionsRef}
            className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-md"
          >
            {filteredSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground text-sm"
                onClick={() => addTag(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {tags.length}/{maxTags} tags
        </span>
        <span>
          Tags are normalized: lowercase, alphanumeric + hyphens
        </span>
      </div>
    </div>
  )
}