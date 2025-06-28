# Fix Authentication for Next.js 15 + React 19

The issue is caused by compatibility problems between Supabase SSR, Next.js 15, and React 19. Here's the fix:

## 1. Update your auth actions to use the new utils

In `/lib/auth/actions.ts`, update the imports:

```typescript
import { createClient } from '@/utils/supabase/server'

export async function signIn(email: string, password: string, redirectTo?: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect(redirectTo || '/')
}
```

## 2. Update all client components to use the new client

Replace all instances of:
```typescript
import { createClient } from '@/lib/supabase/client'
```

With:
```typescript
import { createClient } from '@/utils/supabase/client'
```

## 3. Update server components to use the new server client

Replace:
```typescript
import { createServerSupabaseClient } from '@/lib/supabase/server'
```

With:
```typescript
import { createClient } from '@/utils/supabase/server'
```

## 4. Update the auth context

In your components, replace:
```typescript
import { useAuth } from '@/contexts/auth-context'
```

With:
```typescript
import { useSupabaseAuth } from '@/providers/supabase-auth-provider'
```

## 5. Update the root layout

Replace the AuthProvider with SupabaseAuthProvider:

```typescript
import SupabaseAuthProvider from '@/providers/supabase-auth-provider'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SupabaseAuthProvider>
          <ToastProvider>
            <LayoutClient>{children}</LayoutClient>
          </ToastProvider>
        </SupabaseAuthProvider>
      </body>
    </html>
  )
}
```

## 6. Update protected routes

Use the new AuthWrapper:

```typescript
import AuthWrapper from '@/components/auth/auth-wrapper'

export default function ProtectedPage() {
  return (
    <AuthWrapper>
      {/* Your page content */}
    </AuthWrapper>
  )
}
```

## Why This Works

1. **Proper Cookie Handling**: The new setup ensures cookies are properly set and read
2. **Next.js 15 Compatibility**: Uses the latest patterns for Next.js 15
3. **React 19 Support**: Handles the new React 19 behavior
4. **No Race Conditions**: Properly waits for auth state before rendering

## Testing

1. Clear all cookies
2. Restart your dev server
3. Login and navigate between pages
4. Session should persist correctly