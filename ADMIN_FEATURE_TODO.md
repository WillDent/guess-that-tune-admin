# Admin Feature TODO List

This document summarizes the current state of the admin feature implementation and provides a structured TODO list to complete the feature, based on the review of the codebase and Supabase migration.

---

## ✅ Completed
- **Database migration** for admin features (roles, categories, activity logs, RLS policies)
- **Super admin promotion** logic and function
- **Admin route protection** and sidebar gating in the app
- **Admin dashboard skeleton UI**
- **Category Management (fully implemented and tested)**
    - UI for listing, creating, editing, and deleting categories (admin only)
    - API endpoints for CRUD, with admin-only access and error handling
    - All UI actions use the API (no direct Supabase client in components)
    - `created_by` field is now set using the authenticated user's ID
    - Extensive error handling and logging added to both API and UI
    - Debugged and resolved issues with NOT NULL constraint, infinite loops, and memory
    - End-to-end tested: category creation, update, and delete all work as expected
- **Category Assignment (in progress)**
    - [x] Step 1: Install Emblor
    - [x] Step 2: Update Edit Question Set Page (Emblor TagInput integrated)
    - [x] Step 3: State Management (fetch all/assigned categories)
    - [x] Step 4: UI Integration (TagInput interactive)
    - [x] Step 5: **API route for assignment implemented**
        - `/api/questions/[id]/categories` now supports GET (fetch assignments) and POST (replace assignments), with authentication and error handling.
- **Admin user management (list, promote/demote, suspend/activate, per-user logs)**
- **Activity/audit logs (global and per-user, UI + API)**
- **Analytics dashboard (summary stats, UI + API)**

---

## 🚧 TODO: Application Features (with Technical Details)

### 1. Category Management
- [x] **Create UI for listing all categories (admin only)**
    - `app/admin/categories/page.tsx` created. Uses `AdminRoute` for protection, fetches categories from Supabase, displays a table with name, description, and created date. Loading state included. (No CRUD yet.)
- [x] **Add UI for creating a new category**
    - Added `components/categories/category-form.tsx` (reusable form component).
    - Integrated modal in `app/admin/categories/page.tsx` for category creation.
    - On submit, inserts new category into Supabase, shows loading/error states, and refreshes the list.
- [x] **Add UI for editing and deleting categories**
    - Edit and delete buttons added to each row. Edit opens a modal with the form pre-filled, delete opens a confirmation dialog. Both actions update/delete the category in Supabase, handle loading/error states, and refresh the list.
    - CategoryForm now supports initialValues for editing.
- [x] **Implement API endpoints for category CRUD (admin-only access)**
    - API route at `/api/admin/categories/route.ts` created. Supports GET (list), POST (create), PATCH (update), DELETE (delete). Requires admin user for all actions. Uses Supabase server client and returns JSON responses.
- [x] **Connect UI to Supabase categories table**
    - UI now uses `/api/admin/categories` API endpoints for all CRUD actions via fetch. No direct Supabase client calls in the component.
- [ ] **Show usage statistics for each category (optional)**
    - Query `question_set_categories` for usage count per category.
    - Display in the category list UI.

#### Supabase MCP Instructions
- Use MCP to verify and update RLS policies:
    - List policies: `supabase db policies list`
    - Add/update policy: `supabase db policies create ...`
- Use MCP to apply migrations if schema changes are needed.

---

### 2. Category Assignment (with Emblor Tag Input)
- [x] **Step 1: Install Emblor**
    - Installed `emblor` via `pnpm add emblor`.
    - Note: Peer dependency warnings for React 19, but installation succeeded and ready for use.
- [x] **Step 2: Update Edit Question Set Page**
    - Emblor TagInput integrated in edit page, with correct state and props.
- [x] **Step 3: State Management**
    - All categories and assigned categories are now fetched from the API and formatted for Emblor.
    - Loading and error states are handled in the UI.
- [ ] **Step 4: UI Integration**
    - Render `TagInput` with current assignments and available categories. Allow adding/removing categories.
- [ ] **Step 5: API Wiring**
    - On tag change, update assignments via the API. Show loading and error states.

### 3. User Management
- [ ] **Create UI for listing all users (admin only)**
    - Create `app/admin/users/page.tsx`.
    - Fetch from `users` table, show email, role, status.
- [ ] **Add UI for promoting/demoting users to/from admin**
    - Add promote/demote buttons.
    - Use Supabase `update` to change `role`.
    - Optionally, call `promote_user_to_admin` function (MCP: `supabase db functions call ...`).
- [ ] **Add UI for suspending/unsuspending users**
    - Add suspend/unsuspend buttons.
    - Update `status`, `suspended_at`, `suspended_by` fields.
- [ ] **Implement API endpoints for user management actions**
    - Add `/api/admin/users` route for admin actions.
    - Enforce admin check in API handler.
- [ ] **Show user details and status in the UI**
    - Display all relevant fields, highlight suspended users.

#### Supabase MCP Instructions
- Use MCP to test RLS for user updates.
- Use MCP to call `promote_user_to_admin` for super admin setup.

### 4. Analytics & Activity Logs
- [ ] **Build UI for viewing platform analytics (admin only)**
    - Create `app/admin/analytics/page.tsx`.
    - Fetch stats from Supabase (counts, trends, etc.).
- [ ] **Build UI for viewing activity logs (admin only)**
    - Create `app/admin/logs/page.tsx`.
    - Fetch from `activity_logs` table (admin-only RLS).
- [ ] **Implement API endpoints to fetch analytics and logs**
    - Add `/api/admin/analytics` and `/api/admin/logs` endpoints.
    - Enforce admin check in API handler.

#### Supabase MCP Instructions
- Use MCP to verify RLS for `activity_logs` (only admins can read).
- Use `supabase db query` to fetch logs for manual inspection.

### 5. Audit Logging
- [ ] **Ensure all admin actions (category/user management, etc.) are logged to `activity_logs` from the app/API**
    - After each admin action, insert a log entry (Supabase insert to `activity_logs`).
    - Include `user_id`, `action_type`, `details`, and `ip_address` if available.
- [ ] **Display logs in the admin dashboard**
    - Show recent actions, filter by user/action type.

#### Supabase MCP Instructions
- Use MCP to verify log entries after admin actions.
- Use `supabase db query` to check log contents.

### 6. API Security
- [ ] **Add backend API endpoints for admin-only actions (category/user management)**
    - All admin actions should go through `/api/admin/*` endpoints.
- [ ] **Enforce admin checks in all relevant endpoints**
    - Use session/user context to check `role` before processing.
- [ ] **Ensure RLS policies are respected and tested**
    - Use MCP to test RLS for all new tables and actions.

#### Supabase MCP Instructions
- Use `supabase db policies list` and `supabase db policies test` to verify security.

### 7. Testing & Verification
- [ ] **Add integration tests for admin-only features**
    - Use Playwright MCP to record and run admin UI tests.
    - Example: Test that only admins can access `/admin`, `/admin/categories`, `/admin/users`.
- [ ] **Test RLS enforcement for all new tables and actions**
    - Use Supabase MCP to attempt restricted actions as non-admin.
- [ ] **Verify admin UI is only accessible to admins**
    - Playwright: Try to access admin pages as regular user.
- [ ] **Test super admin promotion on first login**
    - Playwright: Log in as super admin, verify admin UI appears.

#### Playwright MCP Instructions
- Start a Playwright codegen session:
    - `npx playwright codegen http://localhost:3000`
    - Or use MCP: Start codegen session for `/admin` routes.
- Record tests for:
    - Admin login and dashboard access
    - Category CRUD
    - User management actions
    - Analytics/logs viewing
- Save tests in `tests/admin.spec.ts` or similar.
- Run tests: `npx playwright test tests/admin.spec.ts`

---

## 📝 Notes
- The database and authentication groundwork is complete and matches the spec.
- The next step is to build out the admin management UI and connect it to the Supabase backend.
- See `scripts/test-admin-auth.sh` for initial setup verification steps.
- Use Supabase MCP for all migration, policy, and function management.
- Use Playwright MCP for end-to-end and UI testing.

---

**Prioritize Category Management and User Management UIs first, as these are core to the admin experience.**

**Next up:** Integrate Emblor for category assignment 

**Next:** Wire up the frontend to save assignments using this API when categories are changed in the edit page. 

## ✅ COMPLETED
- Category management (CRUD for categories)
- Category assignment to question sets (UI + API)
- API endpoints for category CRUD and assignment
- Frontend integration for category management and assignment
- Error handling and logging for category features
- Dependency and React version fixes for admin UI
- Admin user management (list, promote/demote, suspend/activate, per-user logs)
- Activity/audit logs (global and per-user, UI + API)
- Analytics dashboard (summary stats, UI + API)
- General UI/UX polish for admin features

## 🚧 IN PROGRESS
- API security review and hardening

## ⏳ PENDING
- Advanced filtering/search for logs (date range, action type, keyword)
- Advanced analytics (charts, time range selection, breakdowns)
- Add more tests for admin features 