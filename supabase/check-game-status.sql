-- Check what status values exist in the games table
SELECT DISTINCT status 
FROM games
ORDER BY status;

-- Check the column definition
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'games'
    AND column_name = 'status';