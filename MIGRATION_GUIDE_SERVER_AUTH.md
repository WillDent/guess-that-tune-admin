# Server-First Authentication Migration Guide

## Overview

This guide explains how to migrate from client-side authentication to server-first authentication patterns in Next.js 15 with Supabase.

## Key Principles

1. **Authentication happens on the server** - All auth checks should be in Server Components or Route Handlers
2. **Client components are for UI state only** - Use client auth hooks only for displaying user info
3. **Middleware handles route protection** - Use middleware for efficient auth checks
4. **No client-side redirects for auth** - Server handles all auth redirects

## Migration Steps

### 1. Replace Client-Side Protected Routes

**Before (Client Component):**
```tsx
'use client'
import { ProtectedRoute } from '@/components/auth/protected-route'

export default function MyPage() {
  return (
    <ProtectedRoute>
      {/* Page content */}
    </ProtectedRoute>
  )
}
```

**After (Server Component):**
```tsx
import { requireAuth } from '@/lib/auth/server'

export default async function MyPage() {
  const user = await requireAuth() // Redirects if not authenticated
  
  return (
    <>
      {/* Page content */}
    </>
  )
}
```

### 2. Use Route Groups for Protected Sections

Create a `(protected)` route group with authentication:

```tsx
// app/(protected)/layout.tsx
import { requireAuth } from '@/lib/auth/server'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAuth()
  return <>{children}</>
}
```

Then move protected pages into this group:
- `app/(protected)/profile/page.tsx`
- `app/(protected)/settings/page.tsx`
- `app/(protected)/music/page.tsx`

### 3. Admin Route Protection

**Before:**
```tsx
// app/admin/layout.tsx
import { AdminRoute } from '@/components/auth/admin-route'

export default function AdminLayout({ children }) {
  return <AdminRoute>{children}</AdminRoute>
}
```

**After:**
```tsx
// app/admin/layout.tsx
import { requireAdmin } from '@/lib/auth/server'

export default async function AdminLayout({ children }) {
  await requireAdmin() // Redirects if not admin
  return <>{children}</>
}
```

### 4. API Route Protection

**Before:**
```ts
// app/api/protected/route.ts
export async function GET(request: Request) {
  const { user, error } = await requireAuthRoute(request)
  if (error) return error
  
  // Handler logic
}
```

**After:**
```ts
// app/api/protected/route.ts
import { requireAuth } from '@/lib/auth/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const user = await requireAuth()
    // Handler logic
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
}
```

### 5. Accessing User Data in Components

For displaying user info in Client Components:

```tsx
'use client'
import { useAuth } from '@/lib/auth/client'

export function UserAvatar() {
  const { user, loading } = useAuth()
  
  if (loading) return <Skeleton />
  if (!user) return null
  
  return <Avatar src={user.avatar_url} />
}
```

For Server Components:

```tsx
import { getUser } from '@/lib/auth/server'

export async function UserInfo() {
  const user = await getUser()
  
  if (!user) return null
  
  return <div>Welcome, {user.email}</div>
}
```

### 6. Form Actions

Use Server Actions for auth-related forms:

```tsx
// app/settings/profile-form.tsx
import { updateProfile } from './actions'

export function ProfileForm({ user }) {
  return (
    <form action={updateProfile}>
      <input name="name" defaultValue={user.name} />
      <button type="submit">Update</button>
    </form>
  )
}

// app/settings/actions.ts
'use server'
import { requireAuth } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const user = await requireAuth()
  
  // Update logic
  
  revalidatePath('/settings')
}
```

### 7. Sign Out

Create a server action for sign out:

```tsx
// app/actions/auth.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// In a Client Component:
import { signOut } from '@/app/actions/auth'

<form action={signOut}>
  <button type="submit">Sign Out</button>
</form>
```

## Common Patterns

### Loading States

Since Server Components can't have loading states, use Suspense:

```tsx
import { Suspense } from 'react'
import { ProfileSkeleton } from '@/components/skeletons'

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent />
    </Suspense>
  )
}

async function ProfileContent() {
  const user = await requireAuth()
  // Fetch and display profile
}
```

### Conditional Rendering

For admin-only UI elements:

```tsx
import { isAdmin } from '@/lib/auth/server'

export default async function Navigation() {
  const adminUser = await isAdmin()
  
  return (
    <nav>
      {/* Regular nav items */}
      {adminUser && (
        <Link href="/admin">Admin Panel</Link>
      )}
    </nav>
  )
}
```

## Testing

Test auth flows with the test accounts:
- Admin: `will@dent.ly` / `Odessa99!`
- User: `will.dent@gmail.com` / `odessa99`

Run the auth tests:
```bash
npm run test:rls:comprehensive
```

## Benefits

1. **Better Security** - Auth logic runs on server, not exposed to client
2. **Improved Performance** - No client-side auth checks or redirects
3. **Simpler Code** - No need for loading states in most components
4. **Better SEO** - Server renders authenticated content
5. **Type Safety** - Full TypeScript support with server functions