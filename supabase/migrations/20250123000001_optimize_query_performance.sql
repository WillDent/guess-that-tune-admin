-- Additional indexes for query performance optimization

-- Composite indexes for common query patterns

-- For fetching question sets with user info (covers user_id + is_public filters)
CREATE INDEX IF NOT EXISTS idx_question_sets_public_user_date 
ON question_sets(is_public, user_id, created_at DESC)
WHERE is_public = true;

-- For user's own question sets (private and public)
CREATE INDEX IF NOT EXISTS idx_question_sets_user_date 
ON question_sets(user_id, created_at DESC);

-- For category filtering (check if category_id exists)
-- CREATE INDEX IF NOT EXISTS idx_question_sets_category_public_date 
-- ON question_sets(category_id, is_public, created_at DESC)
-- WHERE is_public = true;

-- For favorites count (if we add a counter column)
-- First add the column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'question_sets' 
    AND column_name = 'favorites_count'
  ) THEN
    ALTER TABLE question_sets 
    ADD COLUMN favorites_count INTEGER DEFAULT 0;
    
    -- Update existing counts
    UPDATE question_sets qs
    SET favorites_count = (
      SELECT COUNT(*) 
      FROM favorites f 
      WHERE f.question_set_id = qs.id
    );
  END IF;
END $$;

-- Index for sorting by popularity
CREATE INDEX IF NOT EXISTS idx_question_sets_favorites_count 
ON question_sets(favorites_count DESC, created_at DESC)
WHERE is_public = true;

-- For questions in a set (already exists but ensure it's optimal)
CREATE INDEX IF NOT EXISTS idx_questions_set_order 
ON questions(question_set_id, display_order);

-- For game participants queries
CREATE INDEX IF NOT EXISTS idx_game_participants_game_user 
ON game_participants(game_id, user_id);

-- For user activity queries
CREATE INDEX IF NOT EXISTS idx_favorites_user_date 
ON favorites(user_id, created_at DESC);

-- For categories hierarchy
CREATE INDEX IF NOT EXISTS idx_categories_parent 
ON categories(parent_id, name)
WHERE parent_id IS NULL;

-- Create a function to update favorites count
CREATE OR REPLACE FUNCTION update_favorites_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE question_sets 
    SET favorites_count = favorites_count + 1
    WHERE id = NEW.question_set_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE question_sets 
    SET favorites_count = GREATEST(0, favorites_count - 1)
    WHERE id = OLD.question_set_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to maintain favorites count
DROP TRIGGER IF EXISTS update_question_set_favorites_count ON favorites;
CREATE TRIGGER update_question_set_favorites_count
AFTER INSERT OR DELETE ON favorites
FOR EACH ROW
EXECUTE FUNCTION update_favorites_count();

-- Analyze tables to update statistics
ANALYZE question_sets;
ANALYZE questions;
ANALYZE favorites;
ANALYZE users;
ANALYZE categories;
ANALYZE game_participants;
ANALYZE games;