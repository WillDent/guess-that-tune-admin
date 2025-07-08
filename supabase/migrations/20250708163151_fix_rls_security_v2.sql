-- Fix Critical RLS Security Vulnerabilities (v2)
-- This migration implements proper row-level security policies to ensure users can only
-- access and modify their own data

-- First, drop ALL existing policies on games and game_participants tables
DO $$
DECLARE
  pol RECORD;
BEGIN
  -- Drop all policies on games table
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'games' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON games', pol.policyname);
  END LOOP;
  
  -- Drop all policies on game_participants table
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'game_participants' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON game_participants', pol.policyname);
  END LOOP;
END $$;

-- Games table policies
-- Users can view games they host or participate in
CREATE POLICY "Users can view own or participating games"
ON games FOR SELECT
TO authenticated
USING (
  host_user_id = auth.uid() OR 
  id IN (
    SELECT game_id 
    FROM game_participants 
    WHERE user_id = auth.uid()
  )
);

-- Users can create games (they become the host)
CREATE POLICY "Users can create own games"
ON games FOR INSERT
TO authenticated
WITH CHECK (host_user_id = auth.uid());

-- Users can update only their own games
CREATE POLICY "Users can update own games"
ON games FOR UPDATE
TO authenticated
USING (host_user_id = auth.uid())
WITH CHECK (host_user_id = auth.uid());

-- Users can delete only their own games
CREATE POLICY "Users can delete own games"
ON games FOR DELETE
TO authenticated
USING (host_user_id = auth.uid());

-- Game participants table policies
-- Users can view participants in games they're in or games they host
CREATE POLICY "Users can view participants in related games"
ON game_participants FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  game_id IN (
    SELECT id 
    FROM games 
    WHERE host_user_id = auth.uid()
  )
);

-- Users can join games (create participation record)
CREATE POLICY "Users can join existing games"
ON game_participants FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  -- Ensure the game exists and is joinable
  EXISTS (
    SELECT 1 
    FROM games 
    WHERE id = game_participants.game_id
  )
);

-- Users can update their own participation
CREATE POLICY "Users can update own participation"
ON game_participants FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can leave games (delete their participation)
-- Game hosts can also remove participants from their games
CREATE POLICY "Users can manage own participation"
ON game_participants FOR DELETE
TO authenticated
USING (
  user_id = auth.uid() OR
  game_id IN (
    SELECT id 
    FROM games 
    WHERE host_user_id = auth.uid()
  )
);

-- Admin override policies for games
CREATE POLICY "Admins override view all games"
ON games FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins override manage all games"
ON games FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Admin override policies for game_participants
CREATE POLICY "Admins override view all participants"
ON game_participants FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins override manage all participants"
ON game_participants FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Verify the new policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('games', 'game_participants')
ORDER BY tablename, policyname;