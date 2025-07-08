# Error Boundaries Implementation Guide

This guide documents the comprehensive error boundary system for gracefully handling failures throughout the application.

## Overview

The error boundary system provides:
- Graceful error handling without app crashes
- Specific handling for different error types (RLS, network, game state)
- User-friendly error messages
- Recovery mechanisms
- Development debugging tools

## Error Boundary Types

### 1. Root Error Boundary
Catches all unhandled errors at the app level.

```typescript
// app/layout.tsx
import { RootErrorBoundary } from '@/components/error-boundaries'

export default function RootLayout({ children }) {
  return (
    <RootErrorBoundary>
      {children}
    </RootErrorBoundary>
  )
}
```

### 2. RLS Error Boundary
Specifically handles Row Level Security violations.

```typescript
import { RLSErrorBoundary } from '@/components/error-boundaries'

<RLSErrorBoundary fallbackMessage="Custom permission message">
  <ProtectedContent />
</RLSErrorBoundary>
```

Features:
- Detects RLS-specific error patterns
- Shows login prompt for unauthenticated users
- Custom fallback messages
- Permission-specific error handling

### 3. Data Error Boundary
Handles data fetching failures.

```typescript
import { DataErrorBoundary } from '@/components/error-boundaries'

<DataErrorBoundary resource="question sets" onRetry={refetch}>
  <QuestionSetList />
</DataErrorBoundary>
```

Features:
- Network error detection
- Timeout handling
- Database error handling
- Retry functionality

### 4. Game Error Boundary
Handles game-specific errors.

```typescript
import { GameErrorBoundary } from '@/components/error-boundaries'

<GameErrorBoundary gameId={gameId} onReset={resetGame}>
  <GameComponent />
</GameErrorBoundary>
```

Features:
- Game state error detection
- Game-specific error messages
- Navigation to games list
- Game ID tracking

### 5. Admin Error Boundary
Handles admin permission errors.

```typescript
import { AdminErrorBoundary } from '@/components/error-boundaries'

<AdminErrorBoundary section="User Management">
  <AdminPanel />
</AdminErrorBoundary>
```

Features:
- Permission checking
- Admin-specific error messages
- Sign out option
- Section identification

## Usage Patterns

### Basic Usage
```typescript
import { DataErrorBoundary } from '@/components/error-boundaries'

export function MyComponent() {
  return (
    <DataErrorBoundary resource="users">
      <UserList /> {/* This might throw */}
    </DataErrorBoundary>
  )
}
```

### Nested Boundaries
```typescript
<DataErrorBoundary resource="games">
  <div>
    {games.map(game => (
      <GameErrorBoundary key={game.id} gameId={game.id}>
        <GameCard game={game} />
      </GameErrorBoundary>
    ))}
  </div>
</DataErrorBoundary>
```

### With Error Handler Hook
```typescript
import { useErrorHandler } from '@/hooks/use-error-handler'

function MyComponent() {
  const { error, executeAsync } = useErrorHandler({
    fallbackMessage: 'Failed to load data'
  })

  const loadData = () => executeAsync(async () => {
    const data = await fetchData()
    return data
  })

  if (error) return <ErrorDisplay error={error} />
  
  return <div>...</div>
}
```

## Error Detection

### RLS Errors
Detected patterns:
- "row-level security"
- "RLS"
- "policy"
- "permission denied"
- "insufficient privileges"
- Error codes: PGRST301, 42501

### Network Errors
Detected patterns:
- "network"
- "fetch"
- "connection"
- "timeout"

### Game Errors
Detected patterns:
- "game not found"
- "game already started"
- "invalid game state"

## Best Practices

### 1. Boundary Placement
- Place boundaries close to where errors might occur
- Use specific boundaries for specific error types
- Always have a root boundary as fallback

### 2. Error Messages
- Provide user-friendly messages
- Include recovery actions
- Show technical details only in development

### 3. Recovery Mechanisms
- Always provide a retry option
- Include navigation options
- Clear error state on recovery

### 4. Logging
```typescript
<BaseErrorBoundary
  onError={(error, errorInfo) => {
    // Log to error tracking service
    console.error('Error:', error)
    // Send to Sentry, LogRocket, etc.
  }}
>
  {children}
</BaseErrorBoundary>
```

## Testing Error Boundaries

### Manual Testing
Use the ErrorBoundaryDemo component:

```typescript
import { ErrorBoundaryDemo } from '@/components/examples/error-boundary-examples'

// Add to a test page
<ErrorBoundaryDemo />
```

### Unit Testing
```typescript
import { render, screen } from '@testing-library/react'
import { RLSErrorBoundary } from '@/components/error-boundaries'

const ThrowError = () => {
  throw new Error('row-level security policy violation')
}

test('RLS boundary shows correct error', () => {
  render(
    <RLSErrorBoundary>
      <ThrowError />
    </RLSErrorBoundary>
  )
  
  expect(screen.getByText(/Access Denied/i)).toBeInTheDocument()
})
```

## Migration Guide

### Step 1: Add Root Boundary
Update your root layout:

```typescript
import { RootErrorBoundary } from '@/components/error-boundaries'

// Wrap your app
<RootErrorBoundary>
  <App />
</RootErrorBoundary>
```

### Step 2: Add Specific Boundaries
Identify areas that need specific error handling:
- Data fetching components → DataErrorBoundary
- Protected routes → RLSErrorBoundary
- Game components → GameErrorBoundary
- Admin sections → AdminErrorBoundary

### Step 3: Remove Try-Catch Blocks
Replace repetitive try-catch with boundaries:

```typescript
// Before
try {
  const data = await fetchData()
} catch (error) {
  setError(error)
  showErrorUI()
}

// After
<DataErrorBoundary>
  <DataComponent /> {/* Handles errors internally */}
</DataErrorBoundary>
```

## Performance Considerations

1. **Isolation**: Use `isolate` prop to prevent full page re-renders
2. **Reset Keys**: Use `resetKeys` to reset boundary on prop changes
3. **Lazy Boundaries**: Import boundaries only where needed

## Future Enhancements

1. **Error Reporting Integration**
   - Sentry integration
   - Custom error tracking

2. **Enhanced Recovery**
   - Automatic retry with exponential backoff
   - Offline detection and queueing

3. **Error Analytics**
   - Track error frequency
   - Identify error patterns
   - User impact metrics