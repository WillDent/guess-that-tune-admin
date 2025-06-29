import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

console.log('[SUPABASE/SERVER] Module loaded')

export async function createServerSupabaseClient(): Promise<ReturnType<typeof createSupabaseServerClient>> {
  console.log('[SUPABASE/SERVER] createServerSupabaseClient called')
  const cookieStore = await cookies()
  console.log('[SUPABASE/SERVER] cookies() resolved')
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const allCookies = cookieStore.getAll()
          console.log('[SUPABASE-SERVER] Getting cookies:', allCookies.length)
          return allCookies
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
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

export function createServerClient(): Promise<ReturnType<typeof createSupabaseServerClient>> {
  console.log('[SUPABASE/SERVER] createServerClient called')
  return createServerSupabaseClient();
}