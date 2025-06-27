import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Define protected and public routes
const protectedRoutes = [
  '/',  // Dashboard should be protected
  '/questions',
  '/games',
  '/profile',
  '/settings',
  '/music'
]

const adminRoutes = [
  '/admin'
]

const publicRoutes = [
  '/login',
  '/signup',
  '/browse',
  '/auth/callback',
  '/auth/signout'
]

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  // Check if it's a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    path === route || path.startsWith(`${route}/`)
  )
  
  // Check if it's an admin route
  const isAdminRoute = adminRoutes.some(route => 
    path === route || path.startsWith(`${route}/`)
  )
  
  // Check if it's a public route
  const isPublicRoute = publicRoutes.some(route => 
    path === route || path.startsWith(`${route}/`)
  )
  
  // Always allow public routes
  if (isPublicRoute) {
    return NextResponse.next()
  }
  
  try {
    // Update the session
    const response = await updateSession(request)
    
    // For protected routes (including admin), check if user has auth cookie
    if (isProtectedRoute || isAdminRoute) {
      const hasAuthCookie = request.cookies.has('sb-rntlhdlzijhdujpxsxzl-auth-token') ||
                           request.cookies.has('sb-rntlhdlzijhdujpxsxzl-auth-token.0') ||
                           request.cookies.has('sb-rntlhdlzijhdujpxsxzl-auth-token.1')
      
      if (!hasAuthCookie) {
        // No auth cookie, redirect to login
        const url = new URL('/login', request.url)
        url.searchParams.set('next', path)
        return NextResponse.redirect(url)
      }
      
      // For admin routes, we'll check role in the page component instead
      // This avoids complex middleware logic that can cause loops
    }
    
    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // On error, allow the request to continue
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