# Server Components Implementation Guide

This guide documents the implementation of server components for improved performance and data fetching.

## Overview

Server components allow us to:
- Fetch data on the server before rendering
- Reduce client-side JavaScript bundle size
- Improve Time to First Byte (TTFB)
- Better SEO and initial page load performance

## Implementation Pattern

### 1. Server Component (page.tsx)
```typescript
// Server component that fetches data
export default async function Page({ searchParams }) {
  const data = await fetchData() // Direct database queries
  
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <ClientContent initialData={data} />
    </Suspense>
  )
}
```

### 2. Client Component (content.tsx)
```typescript
'use client'

// Client component for interactivity
export function ClientContent({ initialData }) {
  const [data, setData] = useState(initialData)
  // Handle client-side interactions
}
```

## Converted Pages

### 1. Browse Page (/app/browse)
- **Server Component**: `page.tsx` - Fetches public question sets
- **Client Component**: `browse-content.tsx` - Handles filtering, search, favorites
- **Benefits**: 
  - Initial data loads faster
  - SEO-friendly for public content
  - URL-based filtering preserves state

### 2. Games Page (/app/games)
- **Server Component**: `page.tsx` - Fetches user's games
- **Client Component**: `games-content.tsx` - Handles game creation, joining
- **Benefits**:
  - Faster initial load of game list
  - Reduced client-side data fetching

## Key Patterns

### 1. Parallel Data Fetching
```typescript
const [data1, data2] = await Promise.all([
  fetchData1(),
  fetchData2()
])
```

### 2. Error Handling
```typescript
try {
  const data = await fetchData()
} catch (error) {
  console.error('Failed to fetch:', error)
  return []  // Graceful fallback
}
```

### 3. Authentication in Server Components
```typescript
const user = await requireAuth(supabase)
if (!user) redirect('/login')
```

### 4. URL-based State Management
Use searchParams for filters to enable:
- Shareable URLs
- Browser back/forward navigation
- Server-side filtering

## Performance Improvements

### Before (Client Components)
1. Page loads → Empty shell
2. JavaScript executes
3. API call to fetch data
4. Render with data

### After (Server Components)
1. Page loads with data already rendered
2. JavaScript hydrates for interactivity

## Best Practices

1. **Keep Server Components Simple**
   - Only data fetching and rendering
   - No event handlers or state

2. **Use Suspense Boundaries**
   - Provide loading states
   - Enable streaming

3. **Optimize Data Fetching**
   - Fetch only needed data
   - Use database indexes
   - Implement pagination server-side

4. **Client Component Boundaries**
   - Keep them as small as possible
   - Pass serializable props only

## Migration Checklist

When converting a page to server components:

1. ✅ Identify data fetching needs
2. ✅ Create types file for shared types
3. ✅ Move data fetching to server component
4. ✅ Extract interactivity to client component
5. ✅ Add Suspense boundaries
6. ✅ Handle loading and error states
7. ✅ Test navigation and state preservation

## Remaining Pages for Conversion

- [ ] Profile page
- [ ] Question sets management
- [ ] Admin pages (where appropriate)

## Measuring Success

Monitor these metrics:
- Time to First Byte (TTFB)
- First Contentful Paint (FCP)
- JavaScript bundle size
- Core Web Vitals scores