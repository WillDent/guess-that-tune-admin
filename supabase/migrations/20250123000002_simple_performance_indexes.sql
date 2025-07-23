-- Simplified performance optimization indexes

-- For fetching question sets with user info
CREATE INDEX IF NOT EXISTS idx_question_sets_public_user_date 
ON question_sets(is_public, user_id, created_at DESC)
WHERE is_public = true;

-- For user's own question sets
CREATE INDEX IF NOT EXISTS idx_question_sets_user_date 
ON question_sets(user_id, created_at DESC);

-- For questions in a set
CREATE INDEX IF NOT EXISTS idx_questions_set_order 
ON questions(question_set_id, order_index);

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

-- Analyze tables to update statistics
ANALYZE question_sets;
ANALYZE questions;
ANALYZE favorites;
ANALYZE users;
ANALYZE categories;
ANALYZE game_participants;
ANALYZE games;