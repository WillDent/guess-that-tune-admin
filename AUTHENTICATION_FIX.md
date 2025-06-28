# Authentication Session Persistence Fix

## Problem
Users are being logged out immediately after signing in when navigating between pages.

## Root Cause
The authentication session is not properly persisting across page navigations due to:
1. Cookie handling issues between client and server
2. Race conditions in auth state propagation
3. Potential mismatch in Supabase client configurations

## Solution Steps

### 1. Update Supabase Client Configuration

Update `/lib/supabase/client.ts`:
```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        name: 'sb-auth-token',
        lifetime: 60 * 60 * 8, // 8 hours
        domain: '',
        path: '/',
        sameSite: 'lax',
      }
    }
  )
}
```

### 2. Fix Middleware Session Handling

Update `/lib/supabase/middleware.ts`:
```typescript
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  await supabase.auth.getUser()

  return response
}
```

### 3. Update Auth Context to Handle SSR Better

Add to `/contexts/auth-context.tsx`:
```typescript
// At the top of AuthProvider
const [isInitialized, setIsInitialized] = useState(false)

// In the initial session check
useEffect(() => {
  let mounted = true;
  
  const initializeAuth = async () => {
    // Skip if already initialized
    if (isInitialized) return;
    
    try {
      // Get session from both methods for redundancy
      const { data: { session } } = await supabase.auth.getSession()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!mounted) return;
      
      if (session && authUser) {
        // Session exists, set user
        await ensureUserExists(authUser)
        const role = await fetchUserRole(authUser.id)
        setUser({ ...authUser, role })
        setIsAdmin(role === 'admin')
      }
      
      setLoading(false)
      setIsInitialized(true)
    } catch (error) {
      console.error('Auth initialization error:', error)
      if (mounted) {
        setLoading(false)
        setIsInitialized(true)
      }
    }
  }
  
  initializeAuth()
  
  return () => { mounted = false }
}, []) // Empty deps - only run once
```

### 4. Add Session Refresh on Route Change

Create `/hooks/use-session-refresh.ts`:
```typescript
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function useSessionRefresh() {
  const pathname = usePathname()
  const supabase = createClient()
  
  useEffect(() => {
    // Refresh session on route change
    supabase.auth.getSession()
  }, [pathname, supabase])
}
```

Add to layout:
```typescript
// In app/layout.tsx
import { useSessionRefresh } from '@/hooks/use-session-refresh'

function RootLayoutClient({ children }: { children: React.ReactNode }) {
  useSessionRefresh() // Add this
  
  return (
    <AuthProvider>
      {/* rest of layout */}
    </AuthProvider>
  )
}
```

### 5. Environment Variable Check

Ensure these are set correctly in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://rntlhdlzijhdujpxsxzl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 6. Debugging Steps

1. Open Chrome DevTools > Application > Cookies
2. Look for cookies starting with `sb-`
3. Check their attributes:
   - Domain should be `localhost`
   - Path should be `/`
   - SameSite should be `Lax`
   - Should NOT be HttpOnly (client needs access)

### 7. Test the Fix

1. Clear all cookies
2. Sign in at `/login`
3. Navigate to `/questions` - should work
4. Navigate to `/music` - should still be authenticated
5. Refresh the page - should remain authenticated

## Alternative Solution

If the above doesn't work, consider using Supabase's built-in auth helpers for Next.js:

```bash
npm install @supabase/auth-helpers-nextjs
```

This provides more robust session handling specifically designed for Next.js apps.

## Monitoring

Add this to your pages to monitor auth state:
```typescript
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key?.includes('auth-token')) {
      console.log('Auth token changed:', e.newValue ? 'Set' : 'Removed')
    }
  })
}
```