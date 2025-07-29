// Global cache for categories to prevent multiple fetches
import type { Database } from '@/lib/supabase/database.types'

type Category = Database['public']['Tables']['categories']['Row']

class CategoriesCache {
  private static instance: CategoriesCache
  private categories: Category[] | null = null
  private loading = false
  private promise: Promise<Category[]> | null = null
  
  private constructor() {}
  
  static getInstance(): CategoriesCache {
    if (!CategoriesCache.instance) {
      CategoriesCache.instance = new CategoriesCache()
    }
    return CategoriesCache.instance
  }
  
  async getCategories(fetcher: () => Promise<Category[]>): Promise<Category[]> {
    // If we already have categories, return them
    if (this.categories) {
      console.log('[CategoriesCache] Returning cached categories:', this.categories.length)
      return this.categories
    }
    
    // If we're already loading, wait for the existing promise
    if (this.loading && this.promise) {
      console.log('[CategoriesCache] Already loading, waiting for existing promise')
      return this.promise
    }
    
    // Start loading
    console.log('[CategoriesCache] Starting fresh fetch')
    this.loading = true
    
    // Create the promise without timeout
    this.promise = fetcher()
      .then(data => {
        console.log('[CategoriesCache] Fetcher resolved with data:', data)
        this.categories = data
        this.loading = false
        this.promise = null // Clear promise after completion
        console.log('[CategoriesCache] Categories cached:', data.length)
        return data
      })
      .catch(err => {
        console.error('[CategoriesCache] Fetcher error:', err)
        this.loading = false
        this.promise = null
        this.categories = [] // Set empty array instead of null on error
        // Return empty array instead of throwing
        return []
      })
    
    return this.promise
  }
  
  // Synchronous method to get cached categories without triggering a fetch
  getCachedCategories(): Category[] | null {
    return this.categories
  }
  
  // Check if categories are currently being loaded
  isLoading(): boolean {
    return this.loading
  }
  
  clear() {
    console.log('[CategoriesCache] Clearing cache')
    this.categories = null
    this.loading = false
    this.promise = null
  }
  
  // Force reset in case of stuck state
  forceReset() {
    console.log('[CategoriesCache] Force resetting cache state')
    this.categories = null
    this.loading = false
    this.promise = null
  }
}

export const categoriesCache = CategoriesCache.getInstance()