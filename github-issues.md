# GitHub Issues for Supabase Integration Improvements

## Immediate Actions (Priority: Critical)

### Issue #1: Consolidate Auth Providers
**Title:** Consolidate duplicate auth providers to single implementation
**Labels:** `bug`, `refactor`, `auth`, `priority:critical`
**Description:**
Currently, the project has multiple competing auth providers causing confusion and potential state inconsistencies:
- `AuthContext` in `/contexts/auth-context.tsx`
- `SupabaseAuthProvider` in `/providers/supabase-auth-provider.tsx`
- Multiple hooks: `useAuth`, `useSupabaseAuth`, `useUser`

**Tasks:**
- [ ] Remove `SupabaseAuthProvider` component
- [ ] Update all components using `SupabaseAuthProvider` to use `AuthContext`
- [ ] Remove duplicate auth hooks (`useSupabaseAuth`)
- [ ] Standardize on single `useAuth` hook from `AuthContext`
- [ ] Update `AuthWrapper` component to use `AuthContext`
- [ ] Test all auth flows after consolidation

**Acceptance Criteria:**
- Only one auth provider exists in the codebase
- All components use the same auth context
- No duplicate auth state management
- All existing auth functionality works as before

---

### Issue #2: Fix Critical RLS Security Vulnerabilities
**Title:** Implement proper Row Level Security policies for games and participants
**Labels:** `security`, `bug`, `database`, `priority:critical`
**Description:**
Current RLS policies are overly permissive, allowing any authenticated user to read/write/delete any game data:
```sql
CREATE POLICY "Allow all for authenticated users"
FOR ALL TO authenticated
USING (true) WITH CHECK (true);
```

This is a critical security vulnerability that needs immediate attention.

**Tasks:**
- [ ] Create new migration file for updated RLS policies
- [ ] Implement ownership-based policies for `games` table
- [ ] Implement participant-based policies for `game_participants` table
- [ ] Add policies for `categories` and `question_set_categories`
- [ ] Test policies with different user roles
- [ ] Ensure admin override capabilities where needed
- [ ] Update documentation with new security model

**Suggested Policies:**
```sql
-- Games table
CREATE POLICY "Users can view games they host or participate in"
ON games FOR SELECT TO authenticated
USING (
  host_id = auth.uid() OR 
  id IN (SELECT game_id FROM game_participants WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their own games"
ON games FOR UPDATE TO authenticated
USING (host_id = auth.uid())
WITH CHECK (host_id = auth.uid());

CREATE POLICY "Users can delete their own games"
ON games FOR DELETE TO authenticated
USING (host_id = auth.uid());

-- Game participants
CREATE POLICY "Users can view participants in their games"
ON game_participants FOR SELECT TO authenticated
USING (
  user_id = auth.uid() OR
  game_id IN (SELECT id FROM games WHERE host_id = auth.uid())
);
```

**Acceptance Criteria:**
- Users can only access games they host or participate in
- Users can only modify/delete their own content
- Admin users have appropriate override permissions
- All existing functionality continues to work with proper authorization

---

### Issue #3: Remove Artificial Delays in Authentication Flow
**Title:** Replace timeout-based auth initialization with deterministic approach
**Labels:** `performance`, `ux`, `auth`, `priority:high`
**Description:**
Current implementation uses artificial delays (1-2 seconds) for auth initialization, causing unnecessary loading states and poor UX.

**Tasks:**
- [ ] Remove timeout-based initialization in `AuthContext`
- [ ] Remove 2-second wait timer in `ProtectedRoute` component
- [ ] Implement proper loading states based on actual auth status
- [ ] Use Promise-based initialization instead of timeouts
- [ ] Add proper error boundaries for auth failures
- [ ] Test auth flow performance after changes

**Acceptance Criteria:**
- No artificial delays in auth flow
- Auth state changes are immediate and reactive
- Loading states accurately reflect actual loading status
- Improved page load times for authenticated users

---

## Best Practices Implementation (Priority: High)

### Issue #4: Implement Pre-flight Session Checks
**Title:** Add session validation before RLS-protected queries
**Labels:** `enhancement`, `auth`, `best-practice`, `priority:high`
**Description:**
Currently, many queries rely on RLS policies to fail when no session exists. This can lead to confusing error messages and poor error handling.

**Tasks:**
- [ ] Create utility function for session validation
- [ ] Update all hooks making RLS-protected queries
- [ ] Add session checks to API routes before database queries
- [ ] Implement consistent error handling for missing sessions
- [ ] Document the pattern for future development

**Implementation Example:**
```typescript
// utils/supabase/with-session.ts
export async function withSession<T>(
  supabase: SupabaseClient,
  callback: (session: Session) => Promise<T>
): Promise<T | null> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    console.error('No valid session for protected query');
    return null;
  }
  return callback(session);
}
```

**Acceptance Criteria:**
- All RLS-protected queries check session first
- Consistent error handling across the application
- No RLS errors shown to users
- Clear error messages for unauthenticated states

---

### Issue #5: Standardize Error Handling for Supabase Queries
**Title:** Implement consistent error handling patterns for all Supabase operations
**Labels:** `enhancement`, `error-handling`, `dx`, `priority:high`
**Description:**
Error handling is inconsistent across the codebase. Some places handle RLS errors gracefully, others throw, and many don't distinguish between error types.

**Tasks:**
- [ ] Create error handling utilities for common Supabase errors
- [ ] Define error type constants for RLS violations
- [ ] Update all Supabase queries to use standardized error handling
- [ ] Add specific handling for RLS errors (PGRST116, 42501)
- [ ] Implement user-friendly error messages
- [ ] Add error logging for debugging

**Error Handler Example:**
```typescript
// utils/supabase/error-handler.ts
export function handleSupabaseError(error: PostgrestError) {
  if (error.code === 'PGRST116' || error.code === '42501') {
    return { type: 'rls_violation', message: 'Access denied' };
  }
  if (error.code === '23505') {
    return { type: 'duplicate', message: 'This item already exists' };
  }
  // ... other error types
  return { type: 'unknown', message: 'An unexpected error occurred' };
}
```

**Acceptance Criteria:**
- Consistent error handling across all Supabase operations
- RLS violations handled gracefully
- User-friendly error messages
- Proper error logging for debugging

---

### Issue #6: Implement Comprehensive RLS Testing
**Title:** Add integration tests for Row Level Security policies
**Labels:** `testing`, `security`, `priority:high`
**Description:**
No tests currently verify that RLS policies work correctly. This is critical for security.

**Tasks:**
- [ ] Set up test environment with test users
- [ ] Create test suite for RLS policies
- [ ] Test access control for different user roles
- [ ] Test edge cases (suspended users, deleted content)
- [ ] Add tests to CI/CD pipeline
- [ ] Document testing approach

**Test Categories:**
- User can only access their own content
- Participants can access shared games
- Admin override permissions work
- Suspended users are properly restricted
- Anonymous users cannot access protected resources

**Acceptance Criteria:**
- Comprehensive test coverage for all RLS policies
- Tests run in CI/CD pipeline
- Clear documentation on testing approach
- All security scenarios are covered

---

### Issue #7: Consolidate Shared Authentication Utilities
**Title:** Use shared auth utilities instead of duplicated code
**Labels:** `refactor`, `code-quality`, `priority:medium`
**Description:**
The `requireAuth` and `requireAdmin` utilities in `/lib/auth/require-auth.ts` are not being used. Instead, the same logic is duplicated across multiple API routes.

**Tasks:**
- [ ] Update all API routes to use shared `requireAuth` function
- [ ] Update admin routes to use shared `requireAdmin` function
- [ ] Remove duplicated auth checking code
- [ ] Add JSDoc comments to shared utilities
- [ ] Consider adding more auth utilities (requireOwner, etc.)

**Acceptance Criteria:**
- No duplicated auth checking code
- All routes use shared utilities
- Consistent auth behavior across API
- Well-documented auth utilities

---

## Architecture Improvements (Priority: Medium)

### Issue #8: Implement Server Components for Data Fetching
**Title:** Leverage Next.js App Router server components for initial data fetching
**Labels:** `enhancement`, `performance`, `architecture`, `priority:medium`
**Description:**
Currently, all pages are client components fetching data via API routes or client-side hooks. This misses the performance benefits of server components.

**Tasks:**
- [ ] Identify pages suitable for server component conversion
- [ ] Implement server component data fetching for static content
- [ ] Use Suspense boundaries for loading states
- [ ] Maintain client interactivity where needed
- [ ] Measure performance improvements
- [ ] Document server component patterns

**Example Pages for Conversion:**
- `/app/browse/page.tsx` - Public question sets
- `/app/games/page.tsx` - Game listings
- `/app/profile/page.tsx` - User profile data

**Acceptance Criteria:**
- Key pages use server components for initial data
- Improved Time to First Byte (TTFB)
- Proper loading states with Suspense
- Client interactivity preserved

---

### Issue #9: Implement Auth State Machine
**Title:** Replace complex auth state management with state machine pattern
**Labels:** `enhancement`, `auth`, `architecture`, `priority:medium`
**Description:**
Current auth state management uses multiple boolean flags and complex logic. A state machine would make auth flows more predictable and easier to debug.

**Tasks:**
- [ ] Design auth state machine with clear states
- [ ] Implement using XState or similar library
- [ ] Define all possible auth transitions
- [ ] Add visualization for debugging
- [ ] Migrate AuthContext to use state machine
- [ ] Update components to use new state pattern

**Auth States:**
- `unauthenticated`
- `authenticating`
- `authenticated`
- `refreshing`
- `error`

**Acceptance Criteria:**
- Clear, predictable auth state transitions
- Easier debugging of auth issues
- No impossible state combinations
- Improved developer experience

---

### Issue #10: Add Comprehensive Error Boundaries
**Title:** Implement error boundaries for graceful RLS failure handling
**Labels:** `enhancement`, `error-handling`, `ux`, `priority:medium`
**Description:**
Add React error boundaries to gracefully handle failures, especially RLS violations, without crashing the entire app.

**Tasks:**
- [ ] Create RLS-specific error boundary component
- [ ] Add error boundaries to key sections of the app
- [ ] Implement fallback UI for different error types
- [ ] Add error reporting/logging
- [ ] Create recovery mechanisms where possible
- [ ] Test error scenarios thoroughly

**Error Boundary Locations:**
- Around data fetching components
- Around admin sections
- Around game components
- At app root level

**Acceptance Criteria:**
- RLS errors don't crash the app
- Users see helpful error messages
- Errors are properly logged
- Recovery options available where appropriate

---

## Summary

Total Issues: 10
- Critical Priority: 3
- High Priority: 4
- Medium Priority: 3

These issues should be addressed in order, with critical security issues taking immediate precedence. Each issue is self-contained but builds upon previous improvements for a more robust Supabase integration.