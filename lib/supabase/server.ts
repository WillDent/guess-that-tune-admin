import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './database.types'
import { SUPABASE_CONFIG } from './config'

export async function createServerSupabaseClient(): Promise<ReturnType<typeof createSupabaseServerClient>> {
  const cookieStore = await cookies()
  
  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: any[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }: { name: string; value: string; options: any }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
      auth: SUPABASE_CONFIG.auth,
      // Temporarily disable custom fetch to fix hanging issue
      // global: SUPABASE_CONFIG.global,
    }
  )
}

export function createServerClient(): Promise<ReturnType<typeof createSupabaseServerClient>> {
  return createServerSupabaseClient();
}

// Alias for backward compatibility
export const createClient = createServerSupabaseClient;