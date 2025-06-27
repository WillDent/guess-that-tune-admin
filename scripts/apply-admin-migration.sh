#!/bin/bash

# Alternative script to apply admin migration directly
# Use this if sync-migrations.sh doesn't work

set -e  # Exit on error

echo "🚀 Direct Admin Migration Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the script's directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
ENV_FILE="$PROJECT_ROOT/.env.local"

cd "$PROJECT_ROOT"

# Function to get project ref from .env.local
get_project_ref() {
    if [ -f "$ENV_FILE" ]; then
        local url=$(grep "NEXT_PUBLIC_SUPABASE_URL" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"' | tr -d "'")
        if [ ! -z "$url" ]; then
            echo "$url" | sed -E 's|https://([^.]+)\.supabase\.co.*|\1|'
        fi
    fi
}

# Get database URL from env
get_database_url() {
    if [ -f "$ENV_FILE" ]; then
        local url=$(grep "DATABASE_URL" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"' | tr -d "'")
        if [ -z "$url" ]; then
            # Try constructing from Supabase URL and password
            local supabase_url=$(grep "NEXT_PUBLIC_SUPABASE_URL" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"' | tr -d "'")
            local db_password=$(grep "SUPABASE_DB_PASSWORD" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"' | tr -d "'")
            local project_ref=$(echo "$supabase_url" | sed -E 's|https://([^.]+)\.supabase\.co.*|\1|')
            
            if [ ! -z "$project_ref" ] && [ ! -z "$db_password" ]; then
                echo "postgresql://postgres.${project_ref}:${db_password}@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
            fi
        else
            echo "$url"
        fi
    fi
}

echo -e "${YELLOW}⚠️  This will apply the admin migration directly to your database${NC}"
echo ""
echo "Use this method if:"
echo "- The normal migration process fails due to history conflicts"
echo "- You want to apply the changes without migration tracking"
echo ""

# Try to get database URL
DATABASE_URL=$(get_database_url)

if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}📝 Database URL not found in .env.local${NC}"
    echo "Please enter your database URL:"
    echo "(You can find this in Supabase Dashboard > Settings > Database)"
    read -p "Database URL: " DATABASE_URL
fi

echo -e "\n${GREEN}🔗 Using database URL${NC}"
echo "URL: ${DATABASE_URL:0:30}..."

read -p "Apply admin migration directly? (y/N) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled"
    exit 0
fi

# Apply the migration
echo -e "\n🚀 Applying admin migration..."

if psql "$DATABASE_URL" -f "supabase/migrations/20250627090937_add_admin_features.sql"; then
    echo -e "${GREEN}✅ Migration applied successfully!${NC}"
    
    # Also apply the promote function
    if [ -f "supabase/functions/promote-super-admin.sql" ]; then
        echo -e "\n📝 Applying admin promotion function..."
        psql "$DATABASE_URL" -f "supabase/functions/promote-super-admin.sql"
        echo -e "${GREEN}✅ Function created${NC}"
    fi
    
    # Generate types
    echo -e "\n📝 Generating TypeScript types..."
    supabase gen types typescript --db-url "$DATABASE_URL" > lib/supabase/database.types.ts
    echo -e "${GREEN}✅ Types generated${NC}"
    
    echo -e "\n${GREEN}✨ Admin migration complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Set NEXT_PUBLIC_SUPER_ADMIN_EMAIL in .env.local"
    echo "2. Restart your development server"
    echo "3. Log in with the super admin email"
    
else
    echo -e "${RED}❌ Migration failed${NC}"
    echo ""
    echo "Common issues:"
    echo "- Some objects might already exist (that's okay)"
    echo "- Check your database connection"
    echo "- Ensure you have the right permissions"
fi