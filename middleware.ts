import { type NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  try {
    const { supabase, response } = createMiddlewareClient(request)

    // Get session (lighter than getUser for middleware)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // Only refresh session if we have one but it might be expired
    let user = session?.user
    let error = sessionError
    
    if (session && !sessionError) {
      // Verify the session is still valid
      const { data: { user: verifiedUser }, error: userError } = await supabase.auth.getUser()
      user = verifiedUser || undefined
      error = userError
    }
    

    // Define public routes that don't require authentication
    const publicRoutes = ['/login', '/signup', '/browse', '/auth', '/test-new-auth', '/api/health-check', '/dev-login']
    const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))

    // If user is not signed in and trying to access a protected route, redirect to login
    if (!user && !isPublicRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('next', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }

    return response
  } catch (error) {
    console.error('[MIDDLEWARE] Error:', error)
    // Return next response on error to prevent breaking the app
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}