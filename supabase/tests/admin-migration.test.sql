-- Test suite for admin features migration
-- Run these tests after applying the migration to verify everything works

-- Test 1: Verify users table has new columns
DO $$
BEGIN
    -- Check role column exists with correct default
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        RAISE EXCEPTION 'Role column missing from users table';
    END IF;
    
    -- Check status column exists with correct default
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'status'
    ) THEN
        RAISE EXCEPTION 'Status column missing from users table';
    END IF;
    
    RAISE NOTICE 'Test 1 passed: Users table has new columns';
END $$;

-- Test 2: Verify all existing users have 'user' role
DO $$
DECLARE
    non_user_count INT;
BEGIN
    SELECT COUNT(*) INTO non_user_count 
    FROM public.users 
    WHERE role IS NULL OR role != 'user';
    
    IF non_user_count > 0 THEN
        RAISE EXCEPTION 'Found % users without proper role', non_user_count;
    END IF;
    
    RAISE NOTICE 'Test 2 passed: All users have correct default role';
END $$;

-- Test 3: Verify new tables exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
        RAISE EXCEPTION 'Categories table not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'question_set_categories') THEN
        RAISE EXCEPTION 'Question_set_categories table not created';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activity_logs') THEN
        RAISE EXCEPTION 'Activity_logs table not created';
    END IF;
    
    RAISE NOTICE 'Test 3 passed: All new tables created';
END $$;

-- Test 4: Verify RLS is enabled on new tables
DO $$
DECLARE
    rls_count INT;
BEGIN
    SELECT COUNT(*) INTO rls_count
    FROM pg_tables
    WHERE tablename IN ('categories', 'question_set_categories', 'activity_logs')
    AND schemaname = 'public'
    AND rowsecurity = true;
    
    IF rls_count != 3 THEN
        RAISE EXCEPTION 'RLS not enabled on all new tables';
    END IF;
    
    RAISE NOTICE 'Test 4 passed: RLS enabled on all new tables';
END $$;

-- Test 5: Verify indexes were created
DO $$
DECLARE
    index_count INT;
BEGIN
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname IN (
        'idx_activity_logs_user_id',
        'idx_activity_logs_action_type',
        'idx_activity_logs_created_at',
        'idx_question_set_categories_category_id',
        'idx_users_role',
        'idx_users_status'
    );
    
    IF index_count < 6 THEN
        RAISE EXCEPTION 'Not all indexes were created. Found % of 6', index_count;
    END IF;
    
    RAISE NOTICE 'Test 5 passed: All indexes created';
END $$;

-- Test 6: Verify is_admin function works
DO $$
DECLARE
    test_result BOOLEAN;
BEGIN
    -- Function should return false for non-existent user
    SELECT public.is_admin(gen_random_uuid()) INTO test_result;
    
    IF test_result != false THEN
        RAISE EXCEPTION 'is_admin function not working correctly';
    END IF;
    
    RAISE NOTICE 'Test 6 passed: is_admin function works';
END $$;

-- Test 7: Verify constraints are in place
DO $$
DECLARE
    constraint_count INT;
BEGIN
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.check_constraints
    WHERE constraint_schema = 'public'
    AND (
        (table_name = 'users' AND constraint_name LIKE '%role%')
        OR (table_name = 'users' AND constraint_name LIKE '%status%')
    );
    
    IF constraint_count < 2 THEN
        RAISE EXCEPTION 'Check constraints not properly created';
    END IF;
    
    RAISE NOTICE 'Test 7 passed: Check constraints are in place';
END $$;

RAISE NOTICE 'All migration tests passed successfully!';