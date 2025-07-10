import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'
import { debugLog } from '@/lib/debug-logger'

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    if (typeof window !== 'undefined') {
      debugLog('[SUPABASE-SINGLETON] Creating browser client')
    } else {
      console.log('[SUPABASE-SINGLETON] Creating client on server. URL:', url)
    }
    
    // Use default Supabase cookie handling - no custom implementation
    browserClient = createBrowserClient<Database>(url, key)
  }

  return browserClient
}