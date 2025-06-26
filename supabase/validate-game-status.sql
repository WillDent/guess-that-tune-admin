-- Check for any invalid status values in games table
SELECT DISTINCT status, COUNT(*) as count
FROM games
GROUP BY status
ORDER BY status;

-- Update any invalid status values (if needed)
-- This will set any unexpected status values to 'pending'
UPDATE games
SET status = 'pending'
WHERE status NOT IN ('pending', 'in_progress', 'completed');

-- Add a CHECK constraint to ensure only valid status values are allowed
-- First drop existing constraint if it exists
ALTER TABLE games 
DROP CONSTRAINT IF EXISTS games_status_check;

-- Add the new constraint
ALTER TABLE games 
ADD CONSTRAINT games_status_check 
CHECK (status IN ('pending', 'in_progress', 'completed'));

-- Verify the constraint was added
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'games'::regclass
    AND contype = 'c';