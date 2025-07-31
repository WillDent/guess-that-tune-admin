import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase/database.types'

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/signup', 
  '/browse',
  '/auth',
  '/api/health-check',
]

// Admin-only routes
const ADMIN_ROUTES = [
  '/admin',
  '/api/admin',
]

export async function middleware(request: NextRequest) {
  // Create response object that we'll modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create Supabase client with proper cookie handling
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if needed
  const { data: { user }, error } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route))
  const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route))

  // Redirect unauthenticated users to login
  if (!user && !isPublicRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Check admin access
  if (user && isAdminRoute) {
    // Since users table doesn't have role field, we'll skip admin check for now
    // In production, you'd want to implement proper role management
    console.warn('Admin route accessed - role checking not implemented')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - images, fonts
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf)$).*)',
  ],
}