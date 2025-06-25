# Supabase Implementation Guide

## Quick Start Checklist

### 1. Project Setup
```bash
# Install Supabase dependencies
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install --save-dev supabase

# Initialize Supabase locally (optional for development)
npx supabase init

# Generate TypeScript types from your schema
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/database.types.ts
```

### 2. Environment Variables
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Implementation Examples

### 1. Authentication Component
```typescript
// components/auth/auth-form.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function AuthForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignIn = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })
    
    if (!error) {
      alert('Check your email for the login link!')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <Input
        type="email"
        placeholder="Your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button onClick={handleSignIn} disabled={loading}>
        {loading ? 'Sending...' : 'Send Magic Link'}
      </Button>
    </div>
  )
}
```

### 2. Question Set CRUD Operations
```typescript
// app/api/question-sets/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
  // Check authentication
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { name, difficulty, questions } = body

  // Start a transaction
  const { data: questionSet, error: setError } = await supabase
    .from('question_sets')
    .insert({
      user_id: session.user.id,
      name,
      difficulty,
      question_count: questions.length
    })
    .select()
    .single()

  if (setError) {
    return NextResponse.json({ error: setError.message }, { status: 400 })
  }

  // Insert questions
  const questionsToInsert = questions.map((q: any, index: number) => ({
    question_set_id: questionSet.id,
    order_index: index,
    correct_song_id: q.correctSong.id,
    correct_song_name: q.correctSong.name,
    correct_song_artist: q.correctSong.artist,
    correct_song_album: q.correctSong.album,
    correct_song_artwork_url: q.correctSong.artwork,
    correct_song_preview_url: q.correctSong.previewUrl,
    detractors: q.detractors
  }))

  const { error: questionsError } = await supabase
    .from('questions')
    .insert(questionsToInsert)

  if (questionsError) {
    // Rollback by deleting the question set
    await supabase.from('question_sets').delete().eq('id', questionSet.id)
    return NextResponse.json({ error: questionsError.message }, { status: 400 })
  }

  return NextResponse.json({ data: questionSet })
}
```

### 3. Real-time Game Updates
```typescript
// components/game/live-game.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

export function LiveGame({ gameId }: { gameId: string }) {
  const [participants, setParticipants] = useState<any[]>([])
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    // Subscribe to game updates
    const gameChannel = supabase
      .channel(`game-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_participants',
          filter: `game_id=eq.${gameId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setParticipants(prev => [...prev, payload.new])
          } else if (payload.eventType === 'UPDATE') {
            setParticipants(prev => 
              prev.map(p => p.id === payload.new.id ? payload.new : p)
            )
          }
        }
      )
      .subscribe()

    setChannel(gameChannel)

    // Cleanup
    return () => {
      gameChannel.unsubscribe()
    }
  }, [gameId])

  return (
    <div>
      <h2>Live Scores</h2>
      {participants.map(participant => (
        <div key={participant.id}>
          {participant.guest_name || 'Player'}: {participant.score} points
        </div>
      ))}
    </div>
  )
}
```

### 4. Middleware for Auth Protection
```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protected routes
  const protectedPaths = ['/questions/new', '/games/create', '/profile']
  const isProtectedPath = protectedPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedPath && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/questions/:path*', '/games/:path*', '/profile/:path*']
}
```

### 5. Custom Hooks for Data Fetching
```typescript
// hooks/use-question-sets.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useUser } from '@/hooks/use-user'

export function useQuestionSets() {
  const user = useUser()
  const [questionSets, setQuestionSets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchQuestionSets = async () => {
      try {
        const { data, error } = await supabase
          .from('question_sets')
          .select(`
            *,
            questions:questions(count)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setQuestionSets(data || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchQuestionSets()

    // Subscribe to changes
    const subscription = supabase
      .channel('question-sets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'question_sets',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchQuestionSets()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  return { questionSets, loading, error }
}
```

## Migration Script Example
```typescript
// scripts/migrate-to-supabase.ts
import { supabase } from '@/lib/supabase/client'

async function migrateLocalStorageToSupabase() {
  // Get data from localStorage
  const localQuestionSets = JSON.parse(
    localStorage.getItem('questionSets') || '[]'
  )

  for (const localSet of localQuestionSets) {
    try {
      // Create question set
      const { data: questionSet, error } = await supabase
        .from('question_sets')
        .insert({
          name: localSet.name,
          difficulty: localSet.difficulty,
          question_count: localSet.questions.length,
          created_at: localSet.createdAt
        })
        .select()
        .single()

      if (error) {
        console.error('Failed to migrate set:', localSet.name, error)
        continue
      }

      // Migrate questions
      const questions = localSet.questions.map((q: any, index: number) => ({
        question_set_id: questionSet.id,
        order_index: index,
        correct_song_id: q.correctSong.id,
        correct_song_name: q.correctSong.name,
        correct_song_artist: q.correctSong.artist,
        correct_song_album: q.correctSong.album,
        correct_song_artwork_url: q.correctSong.artwork,
        correct_song_preview_url: q.correctSong.previewUrl,
        detractors: q.detractors
      }))

      await supabase.from('questions').insert(questions)
      
      console.log('Successfully migrated:', localSet.name)
    } catch (err) {
      console.error('Migration error:', err)
    }
  }
}
```

## Testing Strategy

### 1. Test User Creation
```typescript
// tests/setup-test-user.ts
export async function createTestUser() {
  const { data, error } = await supabase.auth.signUp({
    email: 'test@example.com',
    password: 'testpassword123'
  })
  
  if (error) throw error
  return data.user
}
```

### 2. Test Data Seeding
```typescript
// tests/seed-test-data.ts
export async function seedTestData(userId: string) {
  // Create test question sets
  const testSets = [
    { name: '80s Hits', difficulty: 'easy' },
    { name: '90s Rock', difficulty: 'medium' },
    { name: '2000s Pop', difficulty: 'hard' }
  ]

  for (const set of testSets) {
    await supabase.from('question_sets').insert({
      user_id: userId,
      ...set,
      question_count: 10
    })
  }
}
```

## Performance Optimization

### 1. Batch Operations
```typescript
// Instead of multiple individual inserts
const { data, error } = await supabase
  .from('questions')
  .insert(questionsArray) // Insert all at once
```

### 2. Select Only Needed Fields
```typescript
// Good - only select what you need
const { data } = await supabase
  .from('question_sets')
  .select('id, name, difficulty, question_count')

// Avoid - selecting everything
const { data } = await supabase
  .from('question_sets')
  .select('*')
```

### 3. Use Indexes Effectively
```sql
-- Add indexes for common queries
create index idx_question_sets_user_created 
  on question_sets(user_id, created_at desc);
```

## Error Handling Best Practices

```typescript
// lib/supabase/error-handler.ts
export class SupabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'SupabaseError'
  }
}

export function handleSupabaseError(error: any): never {
  if (error.code === 'PGRST116') {
    throw new SupabaseError('Resource not found', error.code, 404)
  }
  if (error.code === '23505') {
    throw new SupabaseError('Duplicate entry', error.code, 409)
  }
  throw new SupabaseError(error.message || 'Unknown error', error.code, 500)
}
```

## Deployment Checklist

1. [ ] Set up production Supabase project
2. [ ] Configure environment variables in Vercel/hosting platform
3. [ ] Run database migrations
4. [ ] Set up RLS policies
5. [ ] Configure auth providers
6. [ ] Test auth flow end-to-end
7. [ ] Set up monitoring and alerts
8. [ ] Configure backup strategy
9. [ ] Test real-time subscriptions
10. [ ] Performance test with expected load