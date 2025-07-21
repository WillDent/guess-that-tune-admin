-- Migration: Enhance categories with hierarchical structure and metadata
-- Issue: #56

-- Add new columns to categories table
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS icon TEXT,
ADD COLUMN IF NOT EXISTS color TEXT;

-- Add check constraint for color format (hex color)
ALTER TABLE categories 
ADD CONSTRAINT categories_color_check 
CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_question_sets_tags ON question_sets USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_question_set_categories_question_set_id ON question_set_categories(question_set_id);
CREATE INDEX IF NOT EXISTS idx_question_set_categories_category_id ON question_set_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);

-- Add comments for documentation
COMMENT ON COLUMN categories.display_order IS 'Order for displaying categories in UI';
COMMENT ON COLUMN categories.parent_id IS 'Parent category for hierarchical structure';
COMMENT ON COLUMN categories.icon IS 'Icon identifier or URL for visual representation';
COMMENT ON COLUMN categories.color IS 'Hex color code for category visualization';

-- Create a function to get category hierarchy
CREATE OR REPLACE FUNCTION get_category_hierarchy()
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    description TEXT,
    parent_id UUID,
    icon TEXT,
    color TEXT,
    display_order INTEGER,
    level INTEGER,
    path TEXT[]
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE category_tree AS (
        -- Base case: root categories (no parent)
        SELECT 
            c.id,
            c.name,
            c.description,
            c.parent_id,
            c.icon,
            c.color,
            c.display_order,
            0 as level,
            ARRAY[c.name] as path
        FROM categories c
        WHERE c.parent_id IS NULL
        
        UNION ALL
        
        -- Recursive case: child categories
        SELECT 
            c.id,
            c.name,
            c.description,
            c.parent_id,
            c.icon,
            c.color,
            c.display_order,
            ct.level + 1,
            ct.path || c.name
        FROM categories c
        INNER JOIN category_tree ct ON c.parent_id = ct.id
    )
    SELECT * FROM category_tree
    ORDER BY path, display_order;
END;
$$;

-- Create a function to get category with usage count
CREATE OR REPLACE FUNCTION get_categories_with_usage()
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    description TEXT,
    parent_id UUID,
    icon TEXT,
    color TEXT,
    display_order INTEGER,
    usage_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.description,
        c.parent_id,
        c.icon,
        c.color,
        c.display_order,
        COUNT(DISTINCT qsc.question_set_id) as usage_count
    FROM categories c
    LEFT JOIN question_set_categories qsc ON c.id = qsc.category_id
    GROUP BY c.id, c.name, c.description, c.parent_id, c.icon, c.color, c.display_order
    ORDER BY c.display_order, c.name;
END;
$$;

-- Update RLS policies if needed
-- Categories should be readable by all authenticated users
DROP POLICY IF EXISTS "Categories are viewable by authenticated users" ON categories;
CREATE POLICY "Categories are viewable by authenticated users" 
ON categories FOR SELECT 
TO authenticated 
USING (true);

-- Only admins can modify categories
DROP POLICY IF EXISTS "Only admins can insert categories" ON categories;
CREATE POLICY "Only admins can insert categories" 
ON categories FOR INSERT 
TO authenticated 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

DROP POLICY IF EXISTS "Only admins can update categories" ON categories;
CREATE POLICY "Only admins can update categories" 
ON categories FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

DROP POLICY IF EXISTS "Only admins can delete categories" ON categories;
CREATE POLICY "Only admins can delete categories" 
ON categories FOR DELETE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);