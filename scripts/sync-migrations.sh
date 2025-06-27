#!/bin/bash

# Script to sync local migrations with remote database
# This helps when the remote database has migrations not present locally

set -e  # Exit on error

echo "🔄 Migration Sync Script"
echo "======================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the script's directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

cd "$PROJECT_ROOT"

echo -e "${YELLOW}⚠️  This script will sync your local migrations with the remote database${NC}"
echo ""
echo "This is necessary when:"
echo "- The remote database has migrations not present locally"
echo "- You're working with an existing Supabase project"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Sync cancelled"
    exit 0
fi

# First, let's backup our new migration
if [ -f "supabase/migrations/20250627090937_add_admin_features.sql" ]; then
    echo -e "\n📦 Backing up admin features migration..."
    cp "supabase/migrations/20250627090937_add_admin_features.sql" "supabase/migrations/20250627090937_add_admin_features.sql.backup"
    echo -e "${GREEN}✅ Backup created${NC}"
fi

# Repair migration history to mark remote migrations as reverted
echo -e "\n🔧 Repairing migration history..."
supabase migration repair --status reverted 20250625042429 || true
supabase migration repair --status reverted 20250625042443 || true
supabase migration repair --status reverted 20250625044043 || true
supabase migration repair --status reverted 20250625044103 || true
supabase migration repair --status reverted 20250625044116 || true
supabase migration repair --status reverted 20250625044122 || true
supabase migration repair --status reverted 20250625044136 || true

# Now pull the remote schema
echo -e "\n📥 Pulling remote database schema..."
supabase db pull --schema public,auth

echo -e "\n${GREEN}✅ Migration sync complete!${NC}"

# Check if we need to restore our admin migration
if [ -f "supabase/migrations/20250627090937_add_admin_features.sql.backup" ]; then
    if [ ! -f "supabase/migrations/20250627090937_add_admin_features.sql" ]; then
        echo -e "\n📦 Restoring admin features migration..."
        mv "supabase/migrations/20250627090937_add_admin_features.sql.backup" "supabase/migrations/20250627090937_add_admin_features.sql"
        echo -e "${GREEN}✅ Admin migration restored${NC}"
    else
        rm "supabase/migrations/20250627090937_add_admin_features.sql.backup"
    fi
fi

echo -e "\n📋 Current migration status:"
ls -la supabase/migrations/

echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Review the pulled migrations in supabase/migrations/"
echo "2. Run ./scripts/run-migration.sh to apply the admin features migration"
echo "3. If there are conflicts, you may need to adjust the admin migration"