#!/bin/bash

# Script to test admin authentication setup

echo "🔍 Testing Admin Authentication Setup"
echo "===================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get the script's directory and project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
ENV_FILE="$PROJECT_ROOT/.env.local"

echo ""
echo "1. Checking environment variables..."

if [ -f "$ENV_FILE" ]; then
    if grep -q "NEXT_PUBLIC_SUPER_ADMIN_EMAIL" "$ENV_FILE"; then
        ADMIN_EMAIL=$(grep "NEXT_PUBLIC_SUPER_ADMIN_EMAIL" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"' | tr -d "'")
        echo -e "${GREEN}✅ NEXT_PUBLIC_SUPER_ADMIN_EMAIL is set to: $ADMIN_EMAIL${NC}"
    else
        echo -e "${RED}❌ NEXT_PUBLIC_SUPER_ADMIN_EMAIL not found in .env.local${NC}"
        echo "Please add: NEXT_PUBLIC_SUPER_ADMIN_EMAIL=your-email@example.com"
    fi
else
    echo -e "${RED}❌ .env.local file not found${NC}"
fi

echo ""
echo "2. Checking TypeScript types..."

if grep -q "role" "$PROJECT_ROOT/lib/supabase/database.types.ts"; then
    echo -e "${GREEN}✅ Database types include role column${NC}"
else
    echo -e "${RED}❌ Database types might be outdated${NC}"
    echo "Run: supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/database.types.ts"
fi

echo ""
echo "3. Files created/modified:"
echo "  - contexts/auth-context.tsx (enhanced with role support)"
echo "  - hooks/use-is-admin.ts (new hook for admin checks)"
echo "  - middleware.ts (updated with admin route protection)"
echo "  - components/layout/sidebar.tsx (shows admin menu for admins)"
echo "  - app/admin/page.tsx (basic admin dashboard)"

echo ""
echo -e "${YELLOW}Next steps to test:${NC}"
echo "1. Start your development server: npm run dev"
echo "2. Log in with the email set in NEXT_PUBLIC_SUPER_ADMIN_EMAIL"
echo "3. Check if you see the 'Admin' menu item in the sidebar"
echo "4. Try accessing /admin - you should see the admin dashboard"
echo "5. Log in with a different email - you should NOT see the admin menu"
echo "6. Try accessing /admin as non-admin - you should be redirected"

echo ""
echo "To verify in the database:"
echo "1. Check the users table for your super admin email"
echo "2. Verify the role column shows 'admin'"
echo "3. Check activity_logs table for ADMIN_PROMOTED entry"