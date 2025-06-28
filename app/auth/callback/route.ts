import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  console.log('[AUTH-CALLBACK] Processing auth callback...')
  
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'
  
  console.log('[AUTH-CALLBACK] Code:', code ? 'Present' : 'Missing')
  console.log('[AUTH-CALLBACK] Next:', next)

  if (code) {
    const supabase = await createClient()
    console.log('[AUTH-CALLBACK] Exchanging code for session...')
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      console.log('[AUTH-CALLBACK] Code exchange successful')
      
      // Verify the session was created
      const { data: { session } } = await supabase.auth.getSession()
      console.log('[AUTH-CALLBACK] Session after exchange:', session ? 'Present' : 'Missing')
      
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      let redirectUrl
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        redirectUrl = `${origin}${next}`
      } else if (forwardedHost) {
        redirectUrl = `https://${forwardedHost}${next}`
      } else {
        redirectUrl = `${origin}${next}`
      }
      
      console.log('[AUTH-CALLBACK] Redirecting to:', redirectUrl)
      return NextResponse.redirect(redirectUrl)
    } else {
      console.error('[AUTH-CALLBACK] Code exchange error:', error)
    }
  }

  // return the user to an error page with instructions
  console.log('[AUTH-CALLBACK] No code or error, redirecting to error page')
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}