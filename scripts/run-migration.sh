#!/bin/bash

# Script to run database migrations for admin features
# This script helps apply migrations and regenerate types

set -e  # Exit on error

echo "🚀 Admin Features Migration Script"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the script's directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
ENV_FILE="$PROJECT_ROOT/.env.local"

echo "📁 Project root: $PROJECT_ROOT"

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI is not installed${NC}"
    echo "Please install it from: https://supabase.com/docs/guides/cli/getting-started"
    exit 1
fi

# Check if .env.local exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  .env.local file not found at: $ENV_FILE${NC}"
    echo "Looking for .env.example..."
    if [ -f "$PROJECT_ROOT/.env.example" ]; then
        echo "Creating .env.local from .env.example..."
        cp "$PROJECT_ROOT/.env.example" "$ENV_FILE"
        echo -e "${GREEN}✅ Created .env.local${NC}"
        echo "Please update it with your Supabase credentials"
        exit 1
    else
        echo -e "${RED}❌ .env.example not found${NC}"
        echo "Please create .env.local with your Supabase credentials"
        exit 1
    fi
fi

# Function to check if we're logged in to Supabase
check_supabase_login() {
    if ! supabase projects list &> /dev/null; then
        echo -e "${YELLOW}📝 Not logged in to Supabase${NC}"
        echo "Please run: supabase login"
        exit 1
    fi
}

# Function to get project ref from .env.local
get_project_ref() {
    if [ -f "$ENV_FILE" ]; then
        # Try to extract project ref from NEXT_PUBLIC_SUPABASE_URL
        local url=$(grep "NEXT_PUBLIC_SUPABASE_URL" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"' | tr -d "'")
        if [ ! -z "$url" ]; then
            # Extract project ref from URL (format: https://[project-ref].supabase.co)
            echo "$url" | sed -E 's|https://([^.]+)\.supabase\.co.*|\1|'
        fi
    fi
}

echo "📋 Pre-flight checks..."
check_supabase_login

# Try to get project ref
PROJECT_REF=$(get_project_ref)

if [ -z "$PROJECT_REF" ]; then
    echo -e "${YELLOW}⚠️  Could not auto-detect project reference${NC}"
    echo "Please enter your Supabase project reference:"
    echo "(You can find this in your Supabase dashboard URL)"
    read -p "Project ref: " PROJECT_REF
fi

echo -e "\n${GREEN}🔗 Using project: $PROJECT_REF${NC}"

# Change to project root for all Supabase commands
cd "$PROJECT_ROOT"

# Link to the project if not already linked
echo -e "\n📎 Linking to Supabase project..."
if supabase link --project-ref "$PROJECT_REF"; then
    echo -e "${GREEN}✅ Project linked successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Project might already be linked, continuing...${NC}"
fi

# Check migration status
echo -e "\n📊 Checking migration status..."
supabase db remote status

# Ask user to confirm
echo -e "\n${YELLOW}⚠️  This will apply the admin features migration to your database${NC}"
echo "This includes:"
echo "  - Adding role and status columns to users table"
echo "  - Creating categories, question_set_categories, and activity_logs tables"
echo "  - Setting up RLS policies for admin access"
echo ""
read -p "Do you want to continue? (y/N) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled"
    exit 0
fi

# Run the migration
echo -e "\n🚀 Running migration..."
if supabase db push; then
    echo -e "${GREEN}✅ Migration applied successfully${NC}"
else
    echo -e "${RED}❌ Migration failed${NC}"
    exit 1
fi

# Generate TypeScript types
echo -e "\n📝 Generating TypeScript types..."
if supabase gen types typescript --local > lib/supabase/database.types.ts; then
    echo -e "${GREEN}✅ Types generated successfully${NC}"
else
    echo -e "${RED}❌ Failed to generate types${NC}"
    exit 1
fi

# Ask about seed data
echo -e "\n${YELLOW}🌱 Would you like to run seed data?${NC}"
echo "This will add sample categories (Rock, Pop, etc.)"
read -p "Run seed data? (y/N) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Running seed data..."
    if supabase db seed; then
        echo -e "${GREEN}✅ Seed data applied${NC}"
    else
        echo -e "${YELLOW}⚠️  Seed data might have failed (this is okay if categories already exist)${NC}"
    fi
fi

# Set up super admin
echo -e "\n${YELLOW}👤 Super Admin Setup${NC}"
echo "To designate a super admin, add this to your .env.local:"
echo -e "${GREEN}NEXT_PUBLIC_SUPER_ADMIN_EMAIL=your-email@example.com${NC}"
echo ""
echo "The user with this email will automatically become an admin on first login."

# Final instructions
echo -e "\n${GREEN}✨ Migration complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Set NEXT_PUBLIC_SUPER_ADMIN_EMAIL in .env.local"
echo "2. Restart your development server"
echo "3. Log in with the super admin email"
echo "4. Start implementing admin features!"
echo ""
echo "To verify the migration worked, you can run:"
echo "  supabase db remote status"
echo ""
echo "Happy coding! 🎉"