-- Simplest possible RLS fix - Allow all authenticated users to do everything

-- Disable RLS temporarily
ALTER TABLE games DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Anyone can view games" ON games;
DROP POLICY IF EXISTS "Users can create games" ON games;
DROP POLICY IF EXISTS "Users can update their own games" ON games;
DROP POLICY IF EXISTS "Users can delete their own games" ON games;
DROP POLICY IF EXISTS "games_select_host" ON games;
DROP POLICY IF EXISTS "games_select_participant" ON games;
DROP POLICY IF EXISTS "games_select_public" ON games;
DROP POLICY IF EXISTS "games_insert" ON games;
DROP POLICY IF EXISTS "games_update" ON games;
DROP POLICY IF EXISTS "games_delete" ON games;
DROP POLICY IF EXISTS "Users can view games they participate in" ON games;
DROP POLICY IF EXISTS "Users can view games they host" ON games;
DROP POLICY IF EXISTS "Users can update their own games" ON games;
DROP POLICY IF EXISTS "Authenticated users can create games" ON games;

DROP POLICY IF EXISTS "Anyone can view participants" ON game_participants;
DROP POLICY IF EXISTS "Users can create their own participation" ON game_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON game_participants;
DROP POLICY IF EXISTS "Users can delete their own participation" ON game_participants;
DROP POLICY IF EXISTS "participants_select_own" ON game_participants;
DROP POLICY IF EXISTS "participants_select_same_game" ON game_participants;
DROP POLICY IF EXISTS "participants_select_host" ON game_participants;
DROP POLICY IF EXISTS "participants_insert" ON game_participants;
DROP POLICY IF EXISTS "participants_update_own" ON game_participants;
DROP POLICY IF EXISTS "participants_delete_own" ON game_participants;
DROP POLICY IF EXISTS "Users can view participants in games they're in" ON game_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON game_participants;
DROP POLICY IF EXISTS "Authenticated users can join games" ON game_participants;

-- Create ultra-simple policies for games
CREATE POLICY "Allow all for authenticated users on games"
ON games
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create ultra-simple policies for game_participants
CREATE POLICY "Allow all for authenticated users on game_participants"
ON game_participants
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Re-enable RLS
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;

-- Verify
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename IN ('games', 'game_participants')
ORDER BY tablename, policyname;