import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    
    // Use default Supabase cookie handling - no custom implementation
    browserClient = createBrowserClient<Database>(url, key)
  }

  return browserClient
}