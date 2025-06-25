-- Comprehensive fix for RLS policies

-- First, disable RLS temporarily
ALTER TABLE games DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on these tables
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename IN ('games', 'game_participants')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, 
            CASE 
                WHEN pol.policyname LIKE '%games%' THEN 'games'
                ELSE 'game_participants'
            END
        );
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;

-- Create clean policies for games table
CREATE POLICY "games_select_host"
ON games FOR SELECT
TO authenticated
USING (auth.uid() = host_user_id);

CREATE POLICY "games_select_participant"
ON games FOR SELECT
TO authenticated
USING (
    id IN (
        SELECT game_id 
        FROM game_participants 
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "games_select_public"
ON games FOR SELECT
TO authenticated
USING (
    status IN ('waiting', 'in_progress') 
    AND game_mode = 'multiplayer'
);

CREATE POLICY "games_insert"
ON games FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "games_update"
ON games FOR UPDATE
TO authenticated
USING (auth.uid() = host_user_id);

CREATE POLICY "games_delete"
ON games FOR DELETE
TO authenticated
USING (auth.uid() = host_user_id);

-- Create clean policies for game_participants table
CREATE POLICY "participants_select_own"
ON game_participants FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "participants_select_same_game"
ON game_participants FOR SELECT
TO authenticated
USING (
    game_id IN (
        SELECT gp.game_id 
        FROM game_participants gp
        WHERE gp.user_id = auth.uid()
    )
);

CREATE POLICY "participants_select_host"
ON game_participants FOR SELECT
TO authenticated
USING (
    game_id IN (
        SELECT id 
        FROM games 
        WHERE host_user_id = auth.uid()
    )
);

CREATE POLICY "participants_insert"
ON game_participants FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "participants_update_own"
ON game_participants FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "participants_delete_own"
ON game_participants FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Verify the policies are created
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