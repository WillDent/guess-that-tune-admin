# Supabase Backend Implementation Plan

## Overview
This document outlines the plan for migrating from localStorage to Supabase for the Guess That Tune Admin application.

## Database Schema

### 1. Users Table
```sql
create table users (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  username text unique,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table users enable row level security;

-- Policies
create policy "Users can view their own profile" on users
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on users
  for update using (auth.uid() = id);
```

### 2. Question Sets Table
```sql
create table question_sets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade not null,
  name text not null,
  description text,
  difficulty text check (difficulty in ('easy', 'medium', 'hard')) not null,
  question_count integer not null default 0,
  play_count integer not null default 0,
  is_public boolean default false,
  tags text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table question_sets enable row level security;

-- Policies
create policy "Users can view their own question sets" on question_sets
  for select using (auth.uid() = user_id);

create policy "Users can view public question sets" on question_sets
  for select using (is_public = true);

create policy "Users can create their own question sets" on question_sets
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own question sets" on question_sets
  for update using (auth.uid() = user_id);

create policy "Users can delete their own question sets" on question_sets
  for delete using (auth.uid() = user_id);

-- Index for performance
create index idx_question_sets_user_id on question_sets(user_id);
create index idx_question_sets_public on question_sets(is_public) where is_public = true;
```

### 3. Questions Table
```sql
create table questions (
  id uuid default uuid_generate_v4() primary key,
  question_set_id uuid references question_sets(id) on delete cascade not null,
  correct_song_id text not null,
  correct_song_name text not null,
  correct_song_artist text not null,
  correct_song_album text,
  correct_song_artwork_url text,
  correct_song_preview_url text,
  detractors jsonb not null default '[]', -- Array of detractor objects
  order_index integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table questions enable row level security;

-- Policies (inherit from question_sets permissions)
create policy "Users can view questions from accessible question sets" on questions
  for select using (
    exists (
      select 1 from question_sets
      where question_sets.id = questions.question_set_id
      and (question_sets.user_id = auth.uid() or question_sets.is_public = true)
    )
  );

create policy "Users can manage questions in their own question sets" on questions
  for all using (
    exists (
      select 1 from question_sets
      where question_sets.id = questions.question_set_id
      and question_sets.user_id = auth.uid()
    )
  );

-- Index for performance
create index idx_questions_question_set_id on questions(question_set_id);
```

### 4. Games Table
```sql
create table games (
  id uuid default uuid_generate_v4() primary key,
  host_user_id uuid references users(id) on delete set null,
  question_set_id uuid references question_sets(id) on delete cascade not null,
  name text not null,
  code text unique, -- For multiplayer join
  status text check (status in ('pending', 'in_progress', 'completed')) not null default 'pending',
  game_mode text check (game_mode in ('single', 'multiplayer')) not null default 'single',
  max_players integer default 1,
  time_limit integer, -- seconds per question
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  settings jsonb default '{}', -- Additional game settings
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table games enable row level security;

-- Policies
create policy "Users can view their own games" on games
  for select using (host_user_id = auth.uid());

create policy "Users can view games they're participating in" on games
  for select using (
    exists (
      select 1 from game_participants
      where game_participants.game_id = games.id
      and game_participants.user_id = auth.uid()
    )
  );

create policy "Users can create games" on games
  for insert with check (host_user_id = auth.uid());

create policy "Hosts can update their games" on games
  for update using (host_user_id = auth.uid());

-- Index for performance
create index idx_games_host_user_id on games(host_user_id);
create index idx_games_code on games(code) where code is not null;
```

### 5. Game Participants Table
```sql
create table game_participants (
  id uuid default uuid_generate_v4() primary key,
  game_id uuid references games(id) on delete cascade not null,
  user_id uuid references users(id) on delete cascade,
  guest_name text, -- For non-authenticated players
  score integer default 0,
  answers jsonb default '[]', -- Array of answer objects
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  finished_at timestamp with time zone,
  
  constraint participant_identity_check check (
    (user_id is not null and guest_name is null) or
    (user_id is null and guest_name is not null)
  )
);

-- Enable RLS
alter table game_participants enable row level security;

-- Policies
create policy "Participants can view game participants" on game_participants
  for select using (
    exists (
      select 1 from games
      where games.id = game_participants.game_id
      and (
        games.host_user_id = auth.uid() or
        exists (
          select 1 from game_participants gp
          where gp.game_id = games.id
          and gp.user_id = auth.uid()
        )
      )
    )
  );

-- Index for performance
create index idx_game_participants_game_id on game_participants(game_id);
create index idx_game_participants_user_id on game_participants(user_id);
```

### 6. Favorites Table (for bookmarking question sets)
```sql
create table favorites (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade not null,
  question_set_id uuid references question_sets(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(user_id, question_set_id)
);

-- Enable RLS
alter table favorites enable row level security;

-- Policies
create policy "Users can manage their own favorites" on favorites
  for all using (auth.uid() = user_id);
```

## Authentication Strategy

### 1. Sign Up/Sign In Options
- Email/Password
- Magic Link
- OAuth providers (Google, Apple, Spotify)

### 2. User Roles
- **Free User**: Can create up to 5 question sets, play unlimited games
- **Premium User**: Unlimited question sets, advanced features
- **Admin**: Full access to all content, moderation capabilities

## API Layer Design

### 1. Database Functions (RPC)
```sql
-- Get question set with questions
create or replace function get_question_set_with_questions(set_id uuid)
returns json as $$
  select json_build_object(
    'id', qs.id,
    'name', qs.name,
    'difficulty', qs.difficulty,
    'questions', (
      select json_agg(
        json_build_object(
          'id', q.id,
          'correctSong', json_build_object(
            'id', q.correct_song_id,
            'name', q.correct_song_name,
            'artist', q.correct_song_artist,
            'album', q.correct_song_album,
            'artwork', q.correct_song_artwork_url,
            'previewUrl', q.correct_song_preview_url
          ),
          'detractors', q.detractors
        ) order by q.order_index
      )
      from questions q
      where q.question_set_id = qs.id
    )
  )
  from question_sets qs
  where qs.id = set_id
  and (qs.user_id = auth.uid() or qs.is_public = true);
$$ language sql security definer;

-- Search public question sets
create or replace function search_question_sets(search_term text)
returns setof question_sets as $$
  select * from question_sets
  where is_public = true
  and (
    name ilike '%' || search_term || '%' or
    description ilike '%' || search_term || '%' or
    search_term = any(tags)
  )
  order by play_count desc
  limit 50;
$$ language sql security definer;
```

### 2. Real-time Subscriptions
```typescript
// Subscribe to game updates
const gameSubscription = supabase
  .channel('game-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'game_participants',
    filter: `game_id=eq.${gameId}`
  }, handleGameUpdate)
  .subscribe()

// Subscribe to live scores
const scoreSubscription = supabase
  .channel('live-scores')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'game_participants',
    filter: `game_id=eq.${gameId}`
  }, handleScoreUpdate)
  .subscribe()
```

## Migration Strategy

### Phase 1: Setup (Week 1)
1. Create Supabase project
2. Set up authentication
3. Create database schema
4. Configure RLS policies

### Phase 2: Data Layer (Week 2)
1. Create Supabase client utilities
2. Implement authentication flows
3. Create data access layer (hooks/services)
4. Add error handling and retry logic

### Phase 3: Feature Migration (Week 3-4)
1. **Question Sets**: Migrate CRUD operations
2. **Games**: Implement game creation/management
3. **Browse**: Add public question set discovery
4. **Profile**: User profile and settings

### Phase 4: Advanced Features (Week 5-6)
1. Real-time multiplayer games
2. Leaderboards and statistics
3. Social features (following, sharing)
4. Advanced search and filtering

## Supabase Integration Code Structure

### 1. Client Setup
```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### 2. Hooks
```typescript
// hooks/use-question-sets.ts
export function useQuestionSets() {
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuestionSets()
  }, [])

  async function fetchQuestionSets() {
    const { data, error } = await supabase
      .from('question_sets')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setQuestionSets(data)
    }
    setLoading(false)
  }

  return { questionSets, loading, refetch: fetchQuestionSets }
}
```

### 3. Services
```typescript
// services/question-sets.ts
export const questionSetService = {
  async create(data: CreateQuestionSetData) {
    const { data: questionSet, error } = await supabase
      .from('question_sets')
      .insert(data)
      .select()
      .single()
    
    if (error) throw error
    
    // Insert questions
    const questions = data.questions.map((q, index) => ({
      question_set_id: questionSet.id,
      order_index: index,
      ...q
    }))
    
    const { error: questionsError } = await supabase
      .from('questions')
      .insert(questions)
    
    if (questionsError) throw questionsError
    
    return questionSet
  }
}
```

## Performance Considerations

1. **Pagination**: Implement cursor-based pagination for large datasets
2. **Caching**: Use React Query or SWR for client-side caching
3. **Indexes**: Create appropriate database indexes
4. **Edge Functions**: Use for complex operations like game logic
5. **CDN**: Store artwork URLs in Supabase Storage with CDN

## Security Best Practices

1. **RLS**: Strict row-level security policies
2. **Input Validation**: Validate all user inputs
3. **API Keys**: Never expose service keys
4. **Rate Limiting**: Implement rate limiting for API calls
5. **Audit Logs**: Track important user actions

## Cost Optimization

1. **Database**: 
   - Start with free tier (500MB)
   - Monitor query performance
   - Use connection pooling

2. **Storage**:
   - Store only URLs, not actual media files
   - Use Apple Music CDN for artwork

3. **Auth**:
   - Free tier includes 50,000 MAUs
   - Sufficient for initial launch

4. **Realtime**:
   - 200 concurrent connections (free tier)
   - Implement connection management

## Next Steps

1. Create Supabase project
2. Generate TypeScript types
3. Implement auth flow
4. Create migration scripts
5. Build API layer
6. Update UI components
7. Test and deploy