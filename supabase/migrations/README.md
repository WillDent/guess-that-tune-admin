# Database Migrations

## Admin Features Migration (20250627090937)

This migration adds admin functionality to the Guess That Tune application.

### Changes Made:

1. **Users Table Updates**
   - Added `role` column (enum: 'user', 'admin') - defaults to 'user'
   - Added `status` column (enum: 'active', 'suspended') - defaults to 'active'
   - Added `suspended_at` timestamp
   - Added `suspended_by` reference to admin who suspended

2. **New Tables**
   - `categories` - For organizing question sets
   - `question_set_categories` - Junction table for many-to-many relationship
   - `activity_logs` - Audit logging for admin oversight

3. **Row Level Security**
   - Categories: Read by all, write by admins only
   - Question set categories: Managed by owners and admins
   - Activity logs: Admin read only
   - Updated existing policies to exclude suspended users

4. **Indexes**
   - Performance indexes on frequently queried columns
   - Specialized indexes for admin and suspended user lookups

5. **Helper Functions**
   - `is_admin(user_id)` - Check if user is admin
   - `promote_user_to_admin(email)` - Promote user to admin role

### Post-Migration Steps:

1. Set `NEXT_PUBLIC_SUPER_ADMIN_EMAIL` in your `.env.local` file
2. Run `supabase db push` to apply the migration
3. Regenerate types: `supabase gen types typescript --local > lib/supabase/database.types.ts`
4. The application will automatically promote the super admin on first login

### Testing:

1. Verify all existing users have 'user' role
2. Test that existing functionality works unchanged
3. Verify suspended users' content is hidden
4. Test admin-only operations fail for regular users