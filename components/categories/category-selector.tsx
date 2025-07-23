'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Loader2, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import type { Database } from '@/lib/supabase/database.types'
import { categoriesCache } from '@/lib/categories/cache'

type Category = Database['public']['Tables']['categories']['Row']

interface CategorySelectorProps {
  selectedCategoryIds: string[]
  onCategoryChange: (categoryIds: string[]) => void
  className?: string
}

export function CategorySelector({
  selectedCategoryIds,
  onCategoryChange,
  className
}: CategorySelectorProps) {
  const [open, setOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    console.log('[CategorySelector] Component mounted/updated')
    fetchCategories()
  }, []) // Empty dependency array - only run once on mount

  const fetchCategories = async () => {
    try {
      console.log('[CategorySelector] fetchCategories called')
      setLoading(true)
      setError(null)
      
      // Use the cache to fetch categories
      const data = await categoriesCache.getCategories(async () => {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('display_order', { ascending: true })
          .order('name', { ascending: true })

        if (error) {
          console.error('[CategorySelector] Supabase error:', error)
          throw error
        }

        return data || []
      })

      console.log('[CategorySelector] Categories loaded:', data.length, 'categories')
      setCategories(data)
      setLoading(false)
    } catch (err) {
      console.error('[CategorySelector] Error fetching categories:', err)
      setError('Failed to load categories')
      setLoading(false)
    }
  }

  const toggleCategory = (categoryId: string) => {
    if (selectedCategoryIds.includes(categoryId)) {
      onCategoryChange(selectedCategoryIds.filter(id => id !== categoryId))
    } else {
      onCategoryChange([...selectedCategoryIds, categoryId])
    }
  }

  const selectedCategories = categories.filter(cat => 
    selectedCategoryIds.includes(cat.id)
  )

  const renderCategoryItem = (category: Category, level: number = 0) => {
    const isSelected = selectedCategoryIds.includes(category.id)
    const childCategories = categories.filter(cat => cat.parent_id === category.id)

    return (
      <div key={category.id}>
        <CommandItem
          value={category.name}
          onSelect={() => toggleCategory(category.id)}
          className={cn(
            "cursor-pointer",
            level > 0 && `ml-${level * 4}`
          )}
        >
          <Check
            className={cn(
              "mr-2 h-4 w-4",
              isSelected ? "opacity-100" : "opacity-0"
            )}
          />
          <div className="flex items-center gap-2 flex-1">
            {category.icon && <span className="text-lg">{category.icon}</span>}
            <span>{category.name}</span>
            {category.color && (
              <div 
                className="w-3 h-3 rounded-full border"
                style={{ backgroundColor: category.color }}
              />
            )}
          </div>
        </CommandItem>
        {childCategories.length > 0 && (
          <div className="ml-4">
            {childCategories.map(child => renderCategoryItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const rootCategories = categories.filter(cat => !cat.parent_id)

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Label htmlFor="categories">Categories</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                Select from predefined music categories. Categories help organize 
                content and make it easier for users to discover your question sets.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="categories"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading categories...</span>
              </div>
            ) : selectedCategories.length > 0 ? (
              <div className="flex items-center gap-2 flex-wrap">
                {selectedCategories.slice(0, 2).map(cat => (
                  <Badge key={cat.id} variant="secondary" className="text-xs">
                    {cat.icon && <span className="mr-1">{cat.icon}</span>}
                    {cat.name}
                  </Badge>
                ))}
                {selectedCategories.length > 2 && (
                  <Badge variant="secondary" className="text-xs">
                    +{selectedCategories.length - 2} more
                  </Badge>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">Select categories...</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search categories..." />
            <CommandList>
              {error ? (
                <CommandEmpty className="text-destructive">
                  {error}
                </CommandEmpty>
              ) : categories.length === 0 ? (
                <CommandEmpty>No categories available.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {rootCategories.map(category => renderCategoryItem(category))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCategories.map(cat => (
            <Badge 
              key={cat.id} 
              variant="secondary"
              className="cursor-pointer"
              onClick={() => toggleCategory(cat.id)}
            >
              {cat.icon && <span className="mr-1">{cat.icon}</span>}
              {cat.name}
              <span className="ml-1 hover:text-destructive">×</span>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}