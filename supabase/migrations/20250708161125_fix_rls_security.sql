-- Fix Critical RLS Security Vulnerabilities
-- This migration implements proper row-level security policies to ensure users can only
-- access and modify their own data

-- First, drop the overly permissive policies
DROP POLICY IF EXISTS "Allow all for authenticated users on games" ON games;
DROP POLICY IF EXISTS "Allow all for authenticated users on game_participants" ON game_participants;

-- Games table policies
-- Users can view games they host or participate in
CREATE POLICY "Users can view games they host or participate in"
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
CREATE POLICY "Users can create games"
ON games FOR INSERT
TO authenticated
WITH CHECK (host_user_id = auth.uid());

-- Users can update only their own games
CREATE POLICY "Users can update their own games"
ON games FOR UPDATE
TO authenticated
USING (host_user_id = auth.uid())
WITH CHECK (host_user_id = auth.uid());

-- Users can delete only their own games
CREATE POLICY "Users can delete their own games"
ON games FOR DELETE
TO authenticated
USING (host_user_id = auth.uid());

-- Game participants table policies
-- Users can view participants in games they're in or games they host
CREATE POLICY "Users can view participants in their games"
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
CREATE POLICY "Users can join games"
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
CREATE POLICY "Users can update their own participation"
ON game_participants FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can leave games (delete their participation)
-- Game hosts can also remove participants from their games
CREATE POLICY "Users can manage participation"
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

-- Categories table policies (if RLS is enabled)
-- Check if RLS is enabled on categories table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE t.tablename = 'categories' 
    AND t.schemaname = 'public'
    AND c.relrowsecurity = true
  ) THEN
    -- Drop any overly permissive policies
    DROP POLICY IF EXISTS "Allow all for authenticated users" ON categories;
    
    -- Categories are typically public read
    CREATE POLICY "Anyone can view categories"
    ON categories FOR SELECT
    TO authenticated
    USING (true);
    
    -- Only admins can manage categories
    CREATE POLICY "Only admins can manage categories"
    ON categories FOR ALL
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
  END IF;
END $$;

-- Question set categories junction table
-- Check if RLS is enabled on question_set_categories table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE t.tablename = 'question_set_categories' 
    AND t.schemaname = 'public'
    AND c.relrowsecurity = true
  ) THEN
    -- Drop any overly permissive policies
    DROP POLICY IF EXISTS "Allow all for authenticated users" ON question_set_categories;
    
    -- Users can view categories for public question sets or their own
    CREATE POLICY "Users can view question set categories"
    ON question_set_categories FOR SELECT
    TO authenticated
    USING (
      question_set_id IN (
        SELECT id 
        FROM question_sets 
        WHERE is_public = true OR user_id = auth.uid()
      )
    );
    
    -- Users can manage categories for their own question sets
    CREATE POLICY "Users can manage their question set categories"
    ON question_set_categories FOR ALL
    TO authenticated
    USING (
      question_set_id IN (
        SELECT id 
        FROM question_sets 
        WHERE user_id = auth.uid()
      )
    )
    WITH CHECK (
      question_set_id IN (
        SELECT id 
        FROM question_sets 
        WHERE user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Activity logs table
-- Check if RLS is enabled on activity_logs table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE t.tablename = 'activity_logs' 
    AND t.schemaname = 'public'
    AND c.relrowsecurity = true
  ) THEN
    -- Drop any overly permissive policies
    DROP POLICY IF EXISTS "Allow all for authenticated users" ON activity_logs;
    
    -- Only admins can view activity logs
    CREATE POLICY "Only admins can view activity logs"
    ON activity_logs FOR SELECT
    TO authenticated
    USING (
      auth.uid() IN (
        SELECT id FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
      )
    );
    
    -- System can insert activity logs (through service role)
    -- No INSERT policy for authenticated users - logs are created by the system
  END IF;
END $$;

-- Add admin override policies for games and game_participants
-- This allows admins to manage all games for moderation purposes
CREATE POLICY "Admins can view all games"
ON games FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can manage all games"
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

CREATE POLICY "Admins can view all participants"
ON game_participants FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can manage all participants"
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
WHERE tablename IN ('games', 'game_participants', 'categories', 'question_set_categories', 'activity_logs')
ORDER BY tablename, policyname;