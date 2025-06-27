-- Add admin features to existing schema
-- This migration adds role-based access control, categories, and activity logging

-- 1. Add role and status columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES public.users(id);

-- Add comment for documentation
COMMENT ON COLUMN public.users.role IS 'User role: user or admin';
COMMENT ON COLUMN public.users.status IS 'User account status';
COMMENT ON COLUMN public.users.suspended_at IS 'Timestamp when user was suspended';
COMMENT ON COLUMN public.users.suspended_by IS 'Admin who suspended the user';

-- 2. Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id) NOT NULL
);

-- Add comments
COMMENT ON TABLE public.categories IS 'Categories for organizing question sets';
COMMENT ON COLUMN public.categories.name IS 'Unique category name';
COMMENT ON COLUMN public.categories.created_by IS 'Admin who created the category';

-- 3. Create question_set_categories junction table
CREATE TABLE IF NOT EXISTS public.question_set_categories (
    question_set_id UUID REFERENCES public.question_sets(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (question_set_id, category_id)
);

-- Add comment
COMMENT ON TABLE public.question_set_categories IS 'Many-to-many relationship between question sets and categories';

-- 4. Create activity_logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    action_type VARCHAR(50) NOT NULL,
    details JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE public.activity_logs IS 'Audit log for tracking user activities';
COMMENT ON COLUMN public.activity_logs.action_type IS 'Type of action performed';
COMMENT ON COLUMN public.activity_logs.details IS 'Additional context about the action';
COMMENT ON COLUMN public.activity_logs.ip_address IS 'IP address of the user when action was performed';

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON public.activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_set_categories_category_id ON public.question_set_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role) WHERE role = 'admin';
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status) WHERE status = 'suspended';

-- 6. Enable RLS on new tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_set_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for categories
-- Everyone can read categories
CREATE POLICY "Categories are viewable by everyone" 
    ON public.categories FOR SELECT 
    TO authenticated 
    USING (true);

-- Only admins can insert categories
CREATE POLICY "Only admins can create categories" 
    ON public.categories FOR INSERT 
    TO authenticated 
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can update categories
CREATE POLICY "Only admins can update categories" 
    ON public.categories FOR UPDATE 
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

-- Only admins can delete categories
CREATE POLICY "Only admins can delete categories" 
    ON public.categories FOR DELETE 
    TO authenticated 
    USING (
        auth.uid() IN (
            SELECT id FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 8. Create RLS policies for question_set_categories
-- Everyone can read category assignments
CREATE POLICY "Category assignments are viewable by everyone" 
    ON public.question_set_categories FOR SELECT 
    TO authenticated 
    USING (true);

-- Question set owners and admins can manage category assignments
CREATE POLICY "Owners and admins can manage category assignments" 
    ON public.question_set_categories FOR ALL 
    TO authenticated 
    USING (
        auth.uid() IN (
            SELECT user_id FROM public.question_sets 
            WHERE id = question_set_id
        )
        OR 
        auth.uid() IN (
            SELECT id FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM public.question_sets 
            WHERE id = question_set_id
        )
        OR 
        auth.uid() IN (
            SELECT id FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 9. Create RLS policies for activity_logs
-- Only admins can view activity logs
CREATE POLICY "Only admins can view activity logs" 
    ON public.activity_logs FOR SELECT 
    TO authenticated 
    USING (
        auth.uid() IN (
            SELECT id FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- System can insert activity logs (via service role)
CREATE POLICY "System can insert activity logs" 
    ON public.activity_logs FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

-- 10. Update existing RLS policies to respect user status
-- Update question_sets policies to hide content from suspended users
DROP POLICY IF EXISTS "Public question sets are viewable by everyone" ON public.question_sets;
CREATE POLICY "Public question sets are viewable by everyone except from suspended users" 
    ON public.question_sets FOR SELECT 
    TO authenticated 
    USING (
        is_public = true 
        AND user_id NOT IN (
            SELECT id FROM public.users 
            WHERE status = 'suspended'
        )
    );

-- Update games policies to prevent suspended users from hosting
DROP POLICY IF EXISTS "Users can create their own games" ON public.games;
CREATE POLICY "Active users can create their own games" 
    ON public.games FOR INSERT 
    TO authenticated 
    WITH CHECK (
        auth.uid() = host_user_id 
        AND auth.uid() NOT IN (
            SELECT id FROM public.users 
            WHERE status = 'suspended'
        )
    );

-- 11. Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create trigger to update updated_at for categories
CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON public.categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 13. Set super admin from environment variable (this will be handled by application logic)
-- The application will check NEXT_PUBLIC_SUPER_ADMIN_EMAIL on first login and promote that user