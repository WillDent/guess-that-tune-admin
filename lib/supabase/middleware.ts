import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  console.log('[UPDATE-SESSION] Starting session update...')
  
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookies = request.cookies.getAll()
          console.log('[UPDATE-SESSION] Getting cookies:', cookies.length, 'cookies found')
          return cookies
        },
        setAll(cookiesToSet) {
          console.log('[UPDATE-SESSION] Setting cookies:', cookiesToSet.length, 'cookies to set')
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            console.log(`[UPDATE-SESSION] Setting cookie: ${name}`)
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // This will refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  console.log('[UPDATE-SESSION] Getting user from Supabase...')
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('[UPDATE-SESSION] Error getting user:', error.message)
  } else {
    console.log('[UPDATE-SESSION] User found:', user?.email || 'No user')
  }

  return supabaseResponse
}