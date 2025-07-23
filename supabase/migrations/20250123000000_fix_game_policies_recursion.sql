-- Fix infinite recursion in game/game_participants policies
-- The issue: games policy checks game_participants, and game_participants checks games

-- Drop the problematic policies first
DROP POLICY IF EXISTS "Users can view own or participating games" ON games;
DROP POLICY IF EXISTS "Users can view participants in related games" ON game_participants;
DROP POLICY IF EXISTS "Users can manage own participation" ON game_participants;

-- Recreate games policy without the circular reference
-- Users can view games they host
CREATE POLICY "Users can view own games" ON games
FOR SELECT USING (
  host_user_id = (SELECT auth.uid())
);

-- Add a simpler policy for participants to view their games
-- Using EXISTS to avoid the circular reference
CREATE POLICY "Participants can view their games" ON games
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM game_participants gp
    WHERE gp.game_id = games.id 
    AND gp.user_id = (SELECT auth.uid())
  )
);

-- Recreate game_participants policies without the circular reference
-- Participants can view other participants in games they're in
CREATE POLICY "Users can view participants in their games" ON game_participants
FOR SELECT USING (
  game_id IN (
    SELECT game_id 
    FROM game_participants 
    WHERE user_id = (SELECT auth.uid())
  )
);

-- Game hosts can view all participants in their games
CREATE POLICY "Hosts can view participants in their games" ON game_participants
FOR SELECT USING (
  game_id IN (
    SELECT id 
    FROM games 
    WHERE host_user_id = (SELECT auth.uid())
  )
);

-- Users can delete their own participation
CREATE POLICY "Users can leave games" ON game_participants
FOR DELETE USING (
  user_id = (SELECT auth.uid())
);

-- Hosts can remove participants from their games
CREATE POLICY "Hosts can remove participants" ON game_participants
FOR DELETE USING (
  game_id IN (
    SELECT id 
    FROM games 
    WHERE host_user_id = (SELECT auth.uid())
  )
);

-- Add index to improve performance of the participant lookup
CREATE INDEX IF NOT EXISTS idx_game_participants_user_game 
ON game_participants(user_id, game_id);

-- Add index to improve performance of games by host lookup
CREATE INDEX IF NOT EXISTS idx_games_host_user_id 
ON games(host_user_id);