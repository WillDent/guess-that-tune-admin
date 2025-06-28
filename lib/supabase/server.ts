import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const allCookies = cookieStore.getAll()
          console.log('[SUPABASE-SERVER] Getting cookies:', allCookies.length)
          return allCookies
        },
        setAll(cookiesToSet) {
          try {
            console.log('[SUPABASE-SERVER] Setting cookies:', cookiesToSet.length)
            cookiesToSet.forEach(({ name, value, options }) => {
              console.log(`[SUPABASE-SERVER] Setting cookie: ${name}`)
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
            console.log('[SUPABASE-SERVER] Cookie set error (expected in Server Components):', error)
          }
        },
      },
    }
  )
}