# Authentication Consolidation Guide

This guide documents the consolidated authentication utilities and how to migrate existing code.

## Overview

All authentication utilities have been consolidated into `/lib/supabase/` to ensure consistency across the codebase.

## Import Changes

### Before:
```typescript
import { createServerClient } from '@/lib/supabase/server'
import { requireAuth, requireAdmin } from '@/lib/auth/require-auth'
```

### After:
```typescript
import { 
  createServerClient, 
  requireAuth, 
  requireAdmin,
  requireAuthRoute,
  requireAdminRoute,
  handleSupabaseError 
} from '@/lib/supabase'
```

## API Route Migration

### Before (Direct Auth Check):
```typescript
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Your route logic here
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

### After (Using Auth Route Helper):
```typescript
export async function GET(req: NextRequest) {
  return requireAuthRoute(req, async (user, supabase) => {
    // Your route logic here
    // user is guaranteed to be authenticated
    // proper error handling is built-in
  })
}
```

### Admin Routes - Before:
```typescript
async function requireAdmin(supabase: any) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Not authenticated')
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || profile.role !== 'admin') throw new Error('Not authorized')
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    await requireAdmin(supabase)
    // Admin logic here
  } catch (err) {
    // Error handling
  }
}
```

### Admin Routes - After:
```typescript
export async function GET(req: NextRequest) {
  return requireAdminRoute(req, async (user, supabase) => {
    // Admin logic here
    // user is guaranteed to be admin
    // proper error handling is built-in
  })
}
```

## Client-Side Auth Checks

### With Session Validation:
```typescript
import { withSession } from '@/utils/supabase'

const result = await withSession(supabase, async (session) => {
  // Your operation here
  // session is guaranteed to be valid
})

if (!result) {
  // User not authenticated
}
```

## Error Handling

### Consistent Error Handling:
```typescript
import { handleSupabaseError } from '@/utils/supabase'

try {
  // Supabase operation
} catch (error) {
  const handledError = handleSupabaseError(error)
  // handledError has consistent structure with user-friendly messages
}
```

## Migration Checklist

1. **Update imports** - Replace old imports with consolidated ones
2. **Remove duplicate requireAdmin** - Use the one from lib/supabase
3. **Use route helpers** - Replace manual auth checks with requireAuthRoute/requireAdminRoute
4. **Standardize error handling** - Use handleSupabaseError for all Supabase errors
5. **Client validation** - Use withSession for client-side operations requiring auth

## Available Utilities

### Authentication
- `requireAuth(supabase)` - Require authenticated user
- `requireAdmin(supabase)` - Require admin user
- `getCurrentUser(supabase)` - Get current user with role or null

### Route Helpers
- `requireAuthRoute(req, callback)` - Wrap API routes requiring auth
- `requireAdminRoute(req, callback)` - Wrap API routes requiring admin

### Session Management
- `withSession(supabase, callback)` - Client-side session validation
- `hasValidSession(supabase)` - Check if session exists
- `requireSession(supabase)` - Get session or throw

### Error Handling
- `handleSupabaseError(error)` - Convert errors to user-friendly format
- `isRLSError(error)` - Check if error is RLS violation
- `isAuthError(error)` - Check if error is authentication related

## Supabase Client Creation

Always use the consolidated client creation:
```typescript
// Server-side
import { createServerClient } from '@/lib/supabase/server'
const supabase = await createServerClient()

// Client-side
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
```

## Notes

- The `/utils/supabase/` directory previously contained alternate implementations
- All new code should use `/lib/supabase/`
- Existing code should be migrated when touched