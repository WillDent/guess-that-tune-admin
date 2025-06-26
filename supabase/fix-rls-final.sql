-- Final fix for RLS policies - Complete rebuild

-- Step 1: Disable RLS on both tables
ALTER TABLE games DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL policies on game_participants
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'game_participants'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON game_participants', pol.policyname);
    END LOOP;
END $$;

-- Step 3: Drop ALL policies on games
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'games'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON games', pol.policyname);
    END LOOP;
END $$;

-- Step 4: Create simple, non-recursive policies for games
CREATE POLICY "Anyone can view games"
ON games FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create games"
ON games FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Users can update their own games"
ON games FOR UPDATE
TO authenticated
USING (auth.uid() = host_user_id);

CREATE POLICY "Users can delete their own games"
ON games FOR DELETE
TO authenticated
USING (auth.uid() = host_user_id);

-- Step 5: Create simple, non-recursive policies for game_participants
CREATE POLICY "Anyone can view participants"
ON game_participants FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create their own participation"
ON game_participants FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation"
ON game_participants FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own participation"
ON game_participants FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Step 6: Re-enable RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;

-- Step 7: Verify the fix
SELECT 
    tablename,
    policyname,
    permissive,
    cmd,
    qual
FROM pg_policies
WHERE tablename IN ('games', 'game_participants')
ORDER BY tablename, policyname;