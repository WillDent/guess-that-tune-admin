import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase/database.types'

// Define protected and public routes
const protectedRoutes = [
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
  
  // Check if it's an admin route
  const isAdminRoute = adminRoutes.some(route => 
    path.startsWith(route)
  )
  
  // Check if it's a public route
  const isPublicRoute = publicRoutes.some(route => 
    path === route || path.startsWith(`${route}/`)
  )
  
  // For protected routes, check if user is authenticated
  if (isProtectedRoute || isAdminRoute) {
    // Check for auth cookie
    const hasAuthCookie = request.cookies.has('sb-rntlhdlzijhdujpxsxzl-auth-token')
    
    if (!hasAuthCookie) {
      // Redirect to login with return URL
      const url = new URL('/login', request.url)
      url.searchParams.set('next', path)
      return NextResponse.redirect(url)
    }
    
    // For admin routes, check if user is admin
    if (isAdminRoute) {
      // Create a server-side Supabase client
      const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
              )
            },
          },
        }
      )
      
      // Get the user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if user is admin
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (userData?.role !== 'admin') {
          // Not an admin, redirect to home with error
          const url = new URL('/', request.url)
          url.searchParams.set('error', 'unauthorized')
          return NextResponse.redirect(url)
        }
      } else {
        // No user, redirect to login
        const url = new URL('/login', request.url)
        url.searchParams.set('next', path)
        return NextResponse.redirect(url)
      }
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