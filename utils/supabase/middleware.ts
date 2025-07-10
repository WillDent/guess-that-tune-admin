import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/lib/supabase/database.types'

export const createClient = (request: NextRequest) => {
  // Create an unmodified response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Update the existing response object's cookies
          response.cookies.set({
            name,
            value,
            httpOnly: false,
            secure: true,
            sameSite: 'lax',
            path: '/',
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          // Remove from the existing response object's cookies
          response.cookies.set({
            name,
            value: '',
            httpOnly: false,
            secure: true,
            sameSite: 'lax',
            path: '/',
            ...options,
          })
        },
      },
    }
  )

  return { supabase, response }
}
