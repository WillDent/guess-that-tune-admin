#!/bin/bash

# Script to rollback admin features migration if needed

set -e  # Exit on error

echo "🔄 Admin Features Migration Rollback Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${RED}⚠️  WARNING: This will rollback the admin features migration${NC}"
echo "This will:"
echo "  - Drop the categories, question_set_categories, and activity_logs tables"
echo "  - Remove role, status, suspended_at, suspended_by columns from users"
echo "  - Remove all associated functions and policies"
echo ""
read -p "Are you sure you want to rollback? (y/N) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Rollback cancelled"
    exit 0
fi

# Create rollback migration
TIMESTAMP=$(date +%Y%m%d%H%M%S)
ROLLBACK_FILE="supabase/migrations/${TIMESTAMP}_rollback_admin_features.sql"

cat > "$ROLLBACK_FILE" << 'EOF'
-- Rollback admin features migration

-- 1. Drop RLS policies on new tables
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
DROP POLICY IF EXISTS "Only admins can create categories" ON public.categories;
DROP POLICY IF EXISTS "Only admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Only admins can delete categories" ON public.categories;
DROP POLICY IF EXISTS "Category assignments are viewable by everyone" ON public.question_set_categories;
DROP POLICY IF EXISTS "Owners and admins can manage category assignments" ON public.question_set_categories;
DROP POLICY IF EXISTS "Only admins can view activity logs" ON public.activity_logs;
DROP POLICY IF EXISTS "System can insert activity logs" ON public.activity_logs;

-- 2. Drop updated policies (restore original)
DROP POLICY IF EXISTS "Public question sets are viewable by everyone except from suspended users" ON public.question_sets;
CREATE POLICY "Public question sets are viewable by everyone" 
    ON public.question_sets FOR SELECT 
    TO authenticated 
    USING (is_public = true);

DROP POLICY IF EXISTS "Active users can create their own games" ON public.games;
CREATE POLICY "Users can create their own games" 
    ON public.games FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = host_user_id);

-- 3. Drop functions
DROP FUNCTION IF EXISTS public.is_admin(UUID);
DROP FUNCTION IF EXISTS public.promote_user_to_admin(TEXT);

-- 4. Drop indexes
DROP INDEX IF EXISTS public.idx_activity_logs_user_id;
DROP INDEX IF EXISTS public.idx_activity_logs_action_type;
DROP INDEX IF EXISTS public.idx_activity_logs_created_at;
DROP INDEX IF EXISTS public.idx_question_set_categories_category_id;
DROP INDEX IF EXISTS public.idx_users_role;
DROP INDEX IF EXISTS public.idx_users_status;

-- 5. Drop new tables
DROP TABLE IF EXISTS public.activity_logs;
DROP TABLE IF EXISTS public.question_set_categories;
DROP TABLE IF EXISTS public.categories;

-- 6. Remove columns from users table
ALTER TABLE public.users 
DROP COLUMN IF EXISTS role,
DROP COLUMN IF EXISTS status,
DROP COLUMN IF EXISTS suspended_at,
DROP COLUMN IF EXISTS suspended_by;

-- Rollback complete
EOF

echo -e "${GREEN}✅ Created rollback migration: $ROLLBACK_FILE${NC}"
echo ""
echo "To apply the rollback:"
echo "  supabase db push"
echo ""
echo "After rollback, regenerate types:"
echo "  supabase gen types typescript --local > lib/supabase/database.types.ts"