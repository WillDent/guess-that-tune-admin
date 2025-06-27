#!/bin/bash

# Create placeholder migrations for existing remote migrations
# This allows us to sync with the remote database

set -e  # Exit on error

echo "📝 Creating placeholder migrations"
echo "================================="

# Get the script's directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

# Create placeholder migrations for the existing remote migrations
cat > "supabase/migrations/20250625042429_initial.sql" << 'EOF'
-- Placeholder for existing remote migration
-- This migration was already applied to the remote database
EOF

cat > "supabase/migrations/20250625042443_setup.sql" << 'EOF'
-- Placeholder for existing remote migration
-- This migration was already applied to the remote database
EOF

cat > "supabase/migrations/20250625044043_tables.sql" << 'EOF'
-- Placeholder for existing remote migration
-- This migration was already applied to the remote database
EOF

cat > "supabase/migrations/20250625044103_rls.sql" << 'EOF'
-- Placeholder for existing remote migration
-- This migration was already applied to the remote database
EOF

cat > "supabase/migrations/20250625044116_functions.sql" << 'EOF'
-- Placeholder for existing remote migration
-- This migration was already applied to the remote database
EOF

cat > "supabase/migrations/20250625044122_triggers.sql" << 'EOF'
-- Placeholder for existing remote migration
-- This migration was already applied to the remote database
EOF

cat > "supabase/migrations/20250625044136_indexes.sql" << 'EOF'
-- Placeholder for existing remote migration
-- This migration was already applied to the remote database
EOF

echo "✅ Created placeholder migrations"
echo ""
echo "Now you can run: ./scripts/run-migration.sh"