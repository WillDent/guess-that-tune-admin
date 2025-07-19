'use client'

import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchSuggestion {
  term: string
  display: string
  kind: 'terms' | 'topResults'
}

interface SearchSuggestionsProps {
  searchTerm: string
  onSelectSuggestion: (term: string) => void
  className?: string
}

export function SearchSuggestions({ 
  searchTerm, 
  onSelectSuggestion,
  className 
}: SearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    
    if (searchTerm.length < 2) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(searchTerm)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchTerm])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchSuggestions = async (term: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/music/suggestions?term=${encodeURIComponent(term)}`)
      const data = await response.json()
      
      if (response.ok && data.suggestions) {
        setSuggestions(data.suggestions)
        setIsOpen(data.suggestions.length > 0)
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    onSelectSuggestion(suggestion.term)
    setIsOpen(false)
  }

  if (!isOpen || suggestions.length === 0) return null

  return (
    <div 
      ref={dropdownRef}
      className={cn(
        "absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200",
        className
      )}
    >
      <div className="py-1 max-h-60 overflow-auto">
        {loading ? (
          <div className="px-4 py-3 text-sm text-gray-500">Loading suggestions...</div>
        ) : (
          suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.term}-${index}`}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
              onClick={() => handleSelectSuggestion(suggestion)}
            >
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{suggestion.display}</span>
                {suggestion.kind === 'topResults' && (
                  <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    Top Result
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}