# Streaming SSR Performance Guide

## Overview

Streaming SSR allows Next.js to progressively send HTML to the browser as components become ready, improving perceived performance.

## Implementation Patterns

### 1. Basic Streaming with Suspense

```tsx
import { Suspense } from 'react'

export default function Page() {
  return (
    <div>
      {/* This renders immediately */}
      <Header />
      
      {/* This streams when ready */}
      <Suspense fallback={<LoadingSkeleton />}>
        <SlowDataComponent />
      </Suspense>
    </div>
  )
}
```

### 2. Parallel Data Fetching

Split independent data fetches into separate components:

```tsx
// Bad - Sequential fetching
async function Page() {
  const users = await fetchUsers()
  const posts = await fetchPosts()
  const comments = await fetchComments()
  
  return <>{/* render all */}</>
}

// Good - Parallel streaming
export default function Page() {
  return (
    <>
      <Suspense fallback={<UsersSkeleton />}>
        <Users />
      </Suspense>
      <Suspense fallback={<PostsSkeleton />}>
        <Posts />
      </Suspense>
      <Suspense fallback={<CommentsSkeleton />}>
        <Comments />
      </Suspense>
    </>
  )
}
```

### 3. Progressive Enhancement

Load critical content first:

```tsx
export default function ProductPage({ params }) {
  return (
    <div>
      {/* Critical: Product info loads first */}
      <Suspense fallback={<ProductSkeleton />}>
        <ProductInfo id={params.id} />
      </Suspense>
      
      {/* Non-critical: Reviews can load later */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <ProductReviews id={params.id} />
      </Suspense>
      
      {/* Optional: Recommendations load last */}
      <Suspense fallback={null}>
        <RecommendedProducts id={params.id} />
      </Suspense>
    </div>
  )
}
```

### 4. Error Boundaries with Streaming

```tsx
import { ErrorBoundary } from 'react-error-boundary'

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="error-state">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  )
}

export default function Page() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={<Loading />}>
        <DataComponent />
      </Suspense>
    </ErrorBoundary>
  )
}
```

## Query Optimization

### 1. Use Proper Indexes

```sql
-- For streaming question sets by category
CREATE INDEX idx_question_sets_category_created 
ON question_sets(category_id, created_at DESC) 
WHERE is_public = true;

-- For user dashboards
CREATE INDEX idx_question_sets_user_updated 
ON question_sets(created_by, updated_at DESC);
```

### 2. Optimize Select Statements

```tsx
// Bad - Fetches all columns
const { data } = await supabase
  .from('question_sets')
  .select('*')

// Good - Only fetch needed columns
const { data } = await supabase
  .from('question_sets')
  .select(`
    id,
    title,
    description,
    thumbnail_url,
    created_at,
    user:users!created_by(name, avatar_url),
    questions(count),
    favorites(count)
  `)
```

### 3. Use Pagination

```tsx
const PAGE_SIZE = 20

async function QuestionSets({ page = 1 }) {
  const { data, count } = await supabase
    .from('question_sets')
    .select('*', { count: 'exact' })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
    .order('created_at', { ascending: false })
  
  return (
    <>
      <QuestionSetGrid items={data} />
      <Pagination total={count} pageSize={PAGE_SIZE} />
    </>
  )
}
```

## Caching Strategies

### 1. Static Data Caching

```tsx
import { unstable_cache } from 'next/cache'

const getCategories = unstable_cache(
  async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    
    return data
  },
  ['categories'],
  {
    revalidate: 3600, // 1 hour
    tags: ['categories']
  }
)
```

### 2. Request Deduplication

```tsx
import { cache } from 'react'

// Deduplicate requests within the same render
const getUser = cache(async (userId: string) => {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  
  return data
})
```

## Loading States

### 1. Skeleton Components

Create realistic loading states:

```tsx
export function QuestionSetSkeleton() {
  return (
    <Card className="p-6">
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded" />
        <div className="h-4 bg-muted rounded w-5/6" />
        <div className="flex gap-4 mt-4">
          <div className="h-4 bg-muted rounded w-20" />
          <div className="h-4 bg-muted rounded w-20" />
        </div>
      </div>
    </Card>
  )
}
```

### 2. Progressive Loading

Show partial data as it becomes available:

```tsx
async function Dashboard() {
  return (
    <div>
      {/* User info loads fast */}
      <Suspense fallback={<UserInfoSkeleton />}>
        <UserInfo />
      </Suspense>
      
      {/* Stats might be slower */}
      <Suspense fallback={<StatsSkeleton />}>
        <UserStats />
      </Suspense>
      
      {/* Recent activity can load last */}
      <Suspense fallback={<ActivitySkeleton />}>
        <RecentActivity />
      </Suspense>
    </div>
  )
}
```

## Performance Monitoring

### 1. Add Performance Logging

```tsx
async function measureQuery(name: string, queryFn: () => Promise<any>) {
  const start = performance.now()
  try {
    const result = await queryFn()
    const duration = performance.now() - start
    
    // Log slow queries
    if (duration > 100) {
      console.warn(`Slow query ${name}: ${duration}ms`)
    }
    
    return result
  } catch (error) {
    console.error(`Query ${name} failed:`, error)
    throw error
  }
}
```

### 2. Use Web Vitals

```tsx
// app/layout.tsx
import { WebVitals } from '@/components/web-vitals'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <WebVitals />
      </body>
    </html>
  )
}
```

## Best Practices

1. **Prioritize Above-the-Fold Content**: Stream visible content first
2. **Avoid Waterfalls**: Fetch independent data in parallel
3. **Use Proper Cache Headers**: Leverage browser and CDN caching
4. **Minimize Bundle Size**: Split code for faster initial load
5. **Optimize Images**: Use Next.js Image component with proper sizing
6. **Monitor Performance**: Track Core Web Vitals in production

## Example Implementation

See `/app/explore/page.streaming.tsx` for a complete example of streaming SSR with:
- Parallel data fetching
- Progressive loading
- Proper error handling
- Optimized queries