import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'
import { SUPABASE_CONFIG } from './config'

let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createSupabaseBrowserClient() {
  // Return existing client if already created (singleton pattern)
  if (supabaseClient) {
    return supabaseClient
  }

  supabaseClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: SUPABASE_CONFIG.auth,
      // Temporarily disable custom fetch to fix hanging issue
      // global: SUPABASE_CONFIG.global,
    }
  )
  
  return supabaseClient
}