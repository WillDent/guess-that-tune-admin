import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Define protected and public routes
const protectedRoutes = [
  '/questions',
  '/games',
  '/profile',
  '/settings'
]

const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/browse',
  '/auth/callback'
]

export async function middleware(request: NextRequest) {
  // First, update the session
  const response = await updateSession(request)
  
  // Get the pathname
  const path = request.nextUrl.pathname
  
  // Check if it's a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    path.startsWith(route)
  )
  
  // Check if it's a public route
  const isPublicRoute = publicRoutes.some(route => 
    path === route || path.startsWith(`${route}/`)
  )
  
  // For protected routes, check if user is authenticated
  if (isProtectedRoute) {
    // Check for auth cookie
    const hasAuthCookie = request.cookies.has('sb-rntlhdlzijhdujpxsxzl-auth-token')
    
    if (!hasAuthCookie) {
      // Redirect to login with return URL
      const url = new URL('/login', request.url)
      url.searchParams.set('next', path)
      return NextResponse.redirect(url)
    }
  }
  
  // For login/signup pages, redirect to home if already authenticated
  if ((path === '/login' || path === '/signup')) {
    const hasAuthCookie = request.cookies.has('sb-rntlhdlzijhdujpxsxzl-auth-token')
    
    if (hasAuthCookie) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }
  
  return response
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