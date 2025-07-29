import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Define route access levels
const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/browse',
  '/auth',
  '/api/health-check',
  '/api/categories', // Categories are public per RLS policy
  '/',
  '/test-health',
]

const ADMIN_ROUTES = [
  '/admin',
]

const AUTH_ROUTES = [
  '/login',
  '/signup',
  '/auth',
]

export async function middleware(request: NextRequest) {
  // Update session to ensure cookies are properly handled
  const response = await updateSession(request)
  
  try {
    const { pathname } = request.nextUrl
    
    // Check if user is authenticated by checking for auth cookies
    const hasAuthCookie = request.cookies.getAll().some(cookie => 
      cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')
    )
    
    // Allow public routes without auth
    const isPublicRoute = PUBLIC_ROUTES.some(route => 
      pathname === route || pathname.startsWith(`${route}/`)
    )
    
    // Check if it's an auth route (login, signup)
    const isAuthRoute = AUTH_ROUTES.some(route => 
      pathname === route || pathname.startsWith(`${route}/`)
    )
    
    // Check if it's an admin route
    const isAdminRoute = ADMIN_ROUTES.some(route => 
      pathname === route || pathname.startsWith(`${route}/`)
    )
    
    // Redirect authenticated users away from auth pages
    if (hasAuthCookie && isAuthRoute) {
      return NextResponse.redirect(new URL('/profile', request.url))
    }
    
    // Redirect unauthenticated users to login
    if (!hasAuthCookie && !isPublicRoute && !isAuthRoute) {
      const url = new URL('/login', request.url)
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
    
    // For admin routes, we'll rely on server-side requireAdmin() checks
    // The middleware just ensures basic auth, not role checking
    
    return response
  } catch (error) {
    console.error('[MIDDLEWARE] Error:', error)
    // Return the response (not NextResponse.next()) to maintain session handling
    return response
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}