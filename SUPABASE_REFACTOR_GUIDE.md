# Supabase Project Refactoring Guide

## Using Next.js 15.3 + Supabase Starter as the Gold Standard

This guide provides a comprehensive framework for analyzing and refactoring existing Supabase projects to align with modern best practices demonstrated in the Next.js 15.3 + Supabase starter template.

---

## 📋 Table of Contents

1. [Pre-Refactor Audit Checklist](#pre-refactor-audit-checklist)
2. [Core Architecture Analysis](#core-architecture-analysis)
3. [Authentication System Review](#authentication-system-review)
4. [Database & Type Safety Assessment](#database--type-safety-assessment)
5. [Client-Server Separation Evaluation](#client-server-separation-evaluation)
6. [Performance & Optimization Review](#performance--optimization-review)
7. [Testing Infrastructure Analysis](#testing-infrastructure-analysis)
8. [Security & Best Practices Audit](#security--best-practices-audit)
9. [Refactoring Implementation Plan](#refactoring-implementation-plan)
10. [Migration Strategy](#migration-strategy)

---

## 📊 Pre-Refactor Audit Checklist

### Initial Assessment Questions

- [ ] What version of Next.js is currently being used?
- [ ] Is the project using App Router or Pages Router?
- [ ] What Supabase client libraries are installed?
- [ ] Are TypeScript types being generated from the database schema?
- [ ] Is there a clear separation between client and server code?
- [ ] Are database migrations being used or is the schema managed manually?
- [ ] What authentication pattern is currently implemented?
- [ ] Is Row Level Security (RLS) enabled on all tables?
- [ ] Are there any custom authentication middleware implementations?
- [ ] What testing framework is in place (if any)?

### Quick Wins Identification

Before starting a major refactor, identify quick improvements:
- Missing TypeScript types generation
- Unprotected database tables (no RLS)
- Direct database modifications without migrations
- Mixed client/server Supabase instances
- Missing error boundaries
- Unoptimized data fetching patterns

---

## 🏗️ Core Architecture Analysis

### 1. Project Structure Comparison

**Gold Standard Structure:**
```
├── app/                      # App Router
│   ├── (auth)/              # Auth group routes
│   ├── (dashboard)/         # Protected routes
│   ├── api/                 # API routes
│   └── globals.css          # Tailwind v4
├── components/
│   ├── ui/                  # shadcn/ui components
│   └── features/            # Feature components
├── lib/
│   ├── supabase/           # Client configs
│   └── utils.ts            # Utilities
├── server/                  # Server-only code
│   ├── queries/            # DB queries
│   └── actions/            # Server Actions
├── hooks/                   # Client hooks
├── types/
│   └── supabase.ts         # Generated types
└── supabase/
    ├── migrations/         # Database migrations
    └── config.toml         # Supabase config
```

**Analysis Tasks:**
1. Document current project structure
2. Identify deviations from the gold standard
3. List files that need to be moved/reorganized
4. Identify missing directories that need creation

### 2. Framework Version Analysis

**Check for:**
- Next.js version (should be 15.3+)
- React version (should be 19+)
- Supabase client versions
- TypeScript version
- Build tool (should use Turbopack in dev)

**Refactor Requirements:**
```json
{
  "dependencies": {
    "next": "^15.3.0",
    "react": "^19.0.0",
    "@supabase/supabase-js": "^2.x.x",
    "@supabase/ssr": "^0.x.x"
  }
}
```

---

## 🔐 Authentication System Review

### Current State Analysis

**1. Authentication Flow Audit:**
- [ ] How are users currently signing up?
- [ ] Where is authentication state stored?
- [ ] How are protected routes implemented?
- [ ] Is there email verification?
- [ ] How is session management handled?

**2. Code Pattern Review:**

Check for anti-patterns:
```typescript
// ❌ Bad: Client-side auth checks
const { user } = useAuth() // Client hook
if (!user) router.push('/login')

// ✅ Good: Server-side auth checks
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/signin')
```

### Refactoring Requirements

**1. Authentication Pages:**
- Create `(auth)` route group
- Implement `/signin` and `/signup` pages
- Use React Hook Form with Zod validation
- Add proper loading states and error handling

**2. Server Actions:**
- Create `server/actions/auth.ts`
- Implement `signUp`, `signIn`, `signOut` actions
- Add proper type safety and error handling
- Include path revalidation

**3. Middleware Setup:**
- Implement session refresh middleware
- Ensure proper cookie management
- Add route protection at middleware level

---

## 🗄️ Database & Type Safety Assessment

### Schema Management Review

**1. Migration Analysis:**
- [ ] Are migrations being used?
- [ ] Is the schema version controlled?
- [ ] Are there manual schema modifications?
- [ ] Is there a clear migration history?

**2. Type Generation:**
```bash
# Check if types are generated
ls types/supabase.ts

# If not, immediate action:
supabase gen types --local > types/supabase.ts
```

### Refactoring Steps

**1. Implement Migration-First Development:**
```bash
# For each existing table without migration
supabase migration new create_[table]_table

# Add proper migration content:
-- Enable RLS
ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;

-- Add indexes
CREATE INDEX idx_[table]_created_at ON [table](created_at);

-- Add updated_at trigger
CREATE TRIGGER update_[table]_updated_at
  BEFORE UPDATE ON [table]
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**2. Type Safety Implementation:**
- Set up automatic type generation
- Create type helpers for better DX
- Implement strict type checking in queries

---

## 🔄 Client-Server Separation Evaluation

### Current Implementation Review

**Identify Issues:**
1. Mixed client/server Supabase usage
2. Server Components making client-side calls
3. Client Components with direct database access
4. Improper cookie handling in SSR

### Refactoring Implementation

**1. Create Proper Client Configuration:**
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
```

**2. Create Server Configuration:**
```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = async () => {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

---

## ⚡ Performance & Optimization Review

### Current Performance Analysis

**Check for:**
1. Waterfall data loading
2. Missing Suspense boundaries
3. No streaming SSR
4. Inefficient real-time subscriptions
5. Missing prefetching
6. No connection warming

### Optimization Implementation

**1. Parallel Data Loading:**
```typescript
// Convert sequential to parallel
const [posts, profile, stats] = await Promise.all([
  getPosts(),
  getProfile(), 
  getStats()
])
```

**2. Implement Streaming:**
```typescript
// Add Suspense boundaries
<Suspense fallback={<Skeleton />}>
  <DataComponent />
</Suspense>
```

**3. Use `after()` for Non-Blocking Operations:**
```typescript
import { after } from 'next/server'

after(async () => {
  // Analytics, notifications, etc.
})
```

---

## 🧪 Testing Infrastructure Analysis

### Current Testing Review

**Assessment Questions:**
- [ ] Is there a testing framework?
- [ ] Are there any existing tests?
- [ ] Is Supabase being mocked?
- [ ] Are Server Actions tested?
- [ ] Is there CI/CD integration?

### Testing Implementation Plan

**1. Set Up Vitest:**
```bash
npm i -D vitest @testing-library/react @testing-library/user-event @vitejs/plugin-react jsdom
```

**2. Create Test Infrastructure:**
- Mock Supabase clients
- Set up test utilities
- Create component test patterns
- Implement Server Action tests

---

## 🔒 Security & Best Practices Audit

### Security Checklist

**Database Security:**
- [ ] RLS enabled on all tables
- [ ] Proper RLS policies implemented
- [ ] Service role key not exposed client-side
- [ ] Database functions have security definer when needed

**Application Security:**
- [ ] Environment variables properly configured
- [ ] No hardcoded secrets
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Input validation on all forms

### Best Practices Review

**Code Quality:**
- [ ] Consistent error handling
- [ ] Proper TypeScript usage
- [ ] Component composition patterns
- [ ] Server-first architecture
- [ ] Proper use of Server Actions

---

## 📝 Refactoring Implementation Plan

### Phase 1: Foundation (Week 1)

**Day 1-2: Setup & Configuration**
- Update Next.js to 15.3+
- Install required dependencies
- Set up new project structure
- Configure TypeScript and ESLint

**Day 3-4: Database & Types**
- Create missing migrations
- Generate TypeScript types
- Implement type helpers
- Enable RLS on all tables

**Day 5-7: Authentication Core**
- Implement new auth structure
- Create server actions
- Set up middleware
- Migrate existing users

### Phase 2: Migration (Week 2)

**Day 1-3: Component Migration**
- Move to App Router structure
- Convert pages to new format
- Implement proper layouts
- Add error boundaries

**Day 4-5: Data Layer**
- Create server queries
- Implement Server Actions
- Add proper caching
- Set up revalidation

**Day 6-7: Testing & Validation**
- Write critical path tests
- Test authentication flows
- Validate data migrations
- Performance testing

### Phase 3: Optimization (Week 3)

**Day 1-2: Performance**
- Implement streaming SSR
- Add Suspense boundaries
- Optimize data loading
- Add prefetching

**Day 3-4: Real-time & Advanced Features**
- Implement real-time hooks
- Add optimistic updates
- Set up background jobs
- Configure monitoring

**Day 5-7: Polish & Deploy**
- UI/UX improvements
- Final testing
- Documentation
- Deployment preparation

---

## 🚀 Migration Strategy

### 1. Incremental Migration Approach

**For Large Codebases:**
1. Run old and new systems in parallel
2. Migrate one feature at a time
3. Use feature flags for gradual rollout
4. Maintain backwards compatibility

### 2. Data Migration Plan

```sql
-- Example: Migrate auth metadata to profiles
INSERT INTO profiles (id, full_name, created_at)
SELECT 
  id,
  raw_user_meta_data->>'full_name',
  created_at
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = auth.users.id
);
```

### 3. Rollback Strategy

**Prepare for rollback:**
1. Database backup before migration
2. Feature flags for quick disable
3. Keep old code paths temporarily
4. Monitor error rates closely

### 4. Testing Migration

**Critical Tests:**
- User can still log in
- Existing sessions remain valid
- Data integrity maintained
- Performance not degraded
- All features functional

---

## 📊 Success Metrics

### Measurable Improvements

**Performance Metrics:**
- [ ] Time to First Byte (TTFB) < 200ms
- [ ] Core Web Vitals in green
- [ ] Database query performance improved
- [ ] Build time reduced with Turbopack

**Code Quality Metrics:**
- [ ] 100% TypeScript coverage
- [ ] No any types
- [ ] All tables have RLS
- [ ] Test coverage > 70%

**Developer Experience:**
- [ ] Hot reload time < 500ms
- [ ] Type safety throughout
- [ ] Clear error messages
- [ ] Easy onboarding for new devs

---

## 🎯 Final Checklist

Before considering the refactor complete:

- [ ] All database operations use migrations
- [ ] TypeScript types are generated and used everywhere
- [ ] Authentication follows server-first pattern
- [ ] Client and server Supabase instances are separated
- [ ] All tables have proper RLS policies
- [ ] Critical paths have test coverage
- [ ] Performance metrics meet targets
- [ ] Documentation is updated
- [ ] Team is trained on new patterns
- [ ] Monitoring and alerting configured

---

## 📚 Resources

- [Next.js 15.3 Documentation](https://nextjs.org/docs)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Database Migrations Best Practices](https://supabase.com/docs/guides/database/migrations)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

This refactoring guide should be treated as a living document, updated as new best practices emerge and as the project evolves. The goal is not just to match the gold standard, but to create a maintainable, performant, and secure application that can grow with your needs.