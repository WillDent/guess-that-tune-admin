import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

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
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Ensure secure cookie options
              const cookieOptions = {
                ...options,
                sameSite: 'lax' as const,
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                path: '/'
              }
              cookieStore.set(name, value, cookieOptions)
            })
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
      auth: {
        persistSession: true,
        detectSessionInUrl: false,
        autoRefreshToken: true,
      },
      global: {
        headers: {
          'x-application-name': 'guess-that-tune-admin'
        }
      },
      db: {
        schema: 'public'
      }
    }
  )
}

export function createServerClient(): Promise<ReturnType<typeof createSupabaseServerClient>> {
  return createServerSupabaseClient();
}