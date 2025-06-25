-- Fix RLS policies for games and game_participants tables

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Users can view games they participate in" ON games;
DROP POLICY IF EXISTS "Users can view games they host" ON games;
DROP POLICY IF EXISTS "Users can update their own games" ON games;
DROP POLICY IF EXISTS "Authenticated users can create games" ON games;

DROP POLICY IF EXISTS "Users can view participants in games they're in" ON game_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON game_participants;
DROP POLICY IF EXISTS "Authenticated users can join games" ON game_participants;

-- Recreate games policies without recursion
CREATE POLICY "Users can view games they host"
ON games FOR SELECT
TO authenticated
USING (
  auth.uid() = host_user_id
);

CREATE POLICY "Users can view games they participate in"
ON games FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM game_participants
    WHERE game_participants.game_id = games.id
    AND game_participants.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view public games"
ON games FOR SELECT
TO authenticated
USING (
  status IN ('waiting', 'in_progress')
  AND game_mode = 'multiplayer'
);

CREATE POLICY "Users can create games"
ON games FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Users can update their own games"
ON games FOR UPDATE
TO authenticated
USING (auth.uid() = host_user_id)
WITH CHECK (auth.uid() = host_user_id);

-- Recreate game_participants policies without recursion
CREATE POLICY "Users can view their own participation"
ON game_participants FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view participants in their games"
ON game_participants FOR SELECT
TO authenticated
USING (
  game_id IN (
    SELECT id FROM games
    WHERE host_user_id = auth.uid()
  )
);

CREATE POLICY "Users can view participants in games they participate in"
ON game_participants FOR SELECT
TO authenticated
USING (
  game_id IN (
    SELECT game_id FROM game_participants AS gp
    WHERE gp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can join games"
ON game_participants FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation"
ON game_participants FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Make sure RLS is enabled
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;