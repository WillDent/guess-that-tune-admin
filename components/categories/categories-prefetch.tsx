'use client'

import { useEffect } from 'react'
import { categoriesCache } from '@/lib/categories/cache'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client'

export function CategoriesPrefetch() {
  useEffect(() => {
    // Prefetch categories on app load to ensure they're cached
    const prefetchCategories = async () => {
      const supabase = createSupabaseBrowserClient()
      
      try {
        console.log('[CategoriesPrefetch] Prefetching categories...')
        const result = await categoriesCache.getCategories(async () => {
          console.log('[CategoriesPrefetch] Executing Supabase query...')
          const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('display_order', { ascending: true })
            .order('name', { ascending: true })

          console.log('[CategoriesPrefetch] Supabase response:', { data, error })
          
          if (error) {
            console.error('[CategoriesPrefetch] Error:', error)
            throw error
          }

          return data || []
        })
        console.log('[CategoriesPrefetch] Got result:', result)
        console.log('[CategoriesPrefetch] Categories prefetched successfully')
      } catch (error) {
        console.error('[CategoriesPrefetch] Failed to prefetch categories:', error)
      }
    }

    prefetchCategories()
  }, [])

  return null
}