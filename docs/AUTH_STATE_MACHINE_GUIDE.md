# Auth State Machine Implementation Guide

This guide documents the auth state machine implementation that replaces complex boolean flags with predictable state transitions.

## Overview

The auth state machine provides:
- Clear, predictable authentication states
- Impossible state prevention (no more `loading && authenticated`)
- Better debugging with state visualization
- Cleaner code with explicit transitions

## States

### 1. `initial`
- App just started, no auth check performed yet
- Transitions to: `authenticating`

### 2. `authenticating`
- Checking session or performing login
- Transitions to: `authenticated` or `unauthenticated`

### 3. `authenticated`
- User is logged in with valid session
- Transitions to: `unauthenticated`, `refreshing`

### 4. `unauthenticated`
- No user session exists
- Transitions to: `authenticating`

### 5. `refreshing`
- Token refresh in progress
- Transitions to: `authenticated` or `unauthenticated`

### 6. `error`
- Auth error occurred
- Transitions to: `authenticating` (retry)

## State Transitions

```
initial -> INITIALIZE -> authenticating
authenticating -> LOGIN_SUCCESS -> authenticated
authenticating -> LOGIN_FAILURE -> unauthenticated
authenticated -> LOGOUT -> unauthenticated
authenticated -> REFRESH_START -> refreshing
refreshing -> REFRESH_SUCCESS -> authenticated
refreshing -> REFRESH_FAILURE -> unauthenticated
```

## Usage

### Basic Usage
```typescript
import { useAuth } from '@/contexts/auth-context'

function MyComponent() {
  const { user, loading, isAdmin, state } = useAuth()
  
  // Same API as before, plus state
  if (loading) return <Spinner />
  if (!user) return <Login />
  
  return <Dashboard />
}
```

### Advanced Usage - Checking Specific States
```typescript
import { AUTH_STATES } from '@/lib/auth/auth-state-machine'

function MyComponent() {
  const { state, user } = useAuth()
  
  switch (state) {
    case AUTH_STATES.INITIAL:
    case AUTH_STATES.AUTHENTICATING:
      return <LoadingScreen />
      
    case AUTH_STATES.UNAUTHENTICATED:
      return <LoginForm />
      
    case AUTH_STATES.AUTHENTICATED:
    case AUTH_STATES.REFRESHING:
      return <AuthenticatedApp user={user} />
      
    case AUTH_STATES.ERROR:
      return <ErrorScreen />
  }
}
```

## State Machine Benefits

### Before (Boolean Flags)
```typescript
// Possible invalid states:
// loading=true, authenticated=true, user=null ❌
// loading=false, authenticated=true, user=null ❌
// Complex conditional logic everywhere
```

### After (State Machine)
```typescript
// Only valid states exist
// Clear transitions between states
// Single source of truth for auth state
```

## Debugging

### Development Mode Debugger
Add the auth state debugger to your layout in development:

```typescript
import { AuthStateDebugger } from '@/components/debug/auth-state-debugger'

export default function Layout({ children }) {
  return (
    <>
      {children}
      <AuthStateDebugger />
    </>
  )
}
```

### Console Logging
The state machine logs all transitions in development:
```
[Auth State Machine] State: authenticating (Authenticating)
[Auth State Machine] State: authenticated (Authenticated)
```

## Migration Guide

### Step 1: Update Auth Provider
Replace the old AuthProvider with the new version:

```typescript
// app/layout.tsx
import { AuthProvider } from '@/contexts/auth-context-v2'
```

### Step 2: Update Components
The API remains mostly the same:
- `user` - Current user object
- `loading` - Derived from state machine
- `isAdmin` - User role check
- `authInitialized` - Auth system ready
- `state` - NEW: Current state machine state
- `error` - NEW: Auth error if any

### Step 3: Remove Complex Conditionals
Replace complex boolean checks with state checks:

```typescript
// Before
if (loading && !authInitialized && !user) { ... }

// After
if (state === AUTH_STATES.AUTHENTICATING) { ... }
```

## Testing

The state machine makes testing easier:

```typescript
// Test specific state transitions
expect(state).toBe(AUTH_STATES.UNAUTHENTICATED)
mockLogin()
expect(state).toBe(AUTH_STATES.AUTHENTICATING)
await waitFor(() => expect(state).toBe(AUTH_STATES.AUTHENTICATED))
```

## Best Practices

1. **Use Loading Helper**: Continue using `loading` for simple checks
2. **Check Specific States**: Use state constants for complex logic
3. **Handle Errors**: Check for `error` object when needed
4. **Avoid Impossible States**: Trust the state machine

## Rollback

If needed, the old auth context is preserved. Simply import from:
```typescript
import { AuthProvider } from '@/contexts/auth-context'
```