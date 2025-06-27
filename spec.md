# Admin Feature Specification for Guess That Tune

## Overview

This specification outlines the implementation of an administrator role system for the Guess That Tune music quiz application. The admin system will enable platform management, content categorization, user moderation, and analytics tracking.

## 1. Admin Role & Authentication

### 1.1 Admin Designation
- Initial super admin defined via environment variable (e.g., `SUPER_ADMIN_EMAIL`)
- Admin status stored in the `users` table with a new `role` column
- Roles: 'user' (default) and 'admin'
- Admin status is invisible to regular users (no UI indicators)

### 1.2 Admin Promotion
- Existing admins can promote other users to admin status
- No limit on the number of admins
- Promotion done through the admin user management interface

## 2. Category Management System

### 2.1 Category Structure
- Flat category system (no hierarchy)
- Categories stored in new `categories` table
- Fields: id, name, description, created_at, updated_at, created_by

### 2.2 Category Types
Examples of categories to support:
- **Genres**: Rock, Pop, Country, Hip-Hop, Classical, Jazz, Electronic
- **Eras**: 50s, 60s, 70s, 80s, 90s, 2000s, 2010s, 2020s
- **Themes**: Love Songs, Party Hits, Workout Music, Road Trip, Study Music

### 2.3 Admin CRUD Operations
- **Create**: Add new categories with name and optional description
- **Read**: View all categories with usage statistics
- **Update**: Edit category name and description
- **Delete**: Remove categories (associated question sets become uncategorized)

### 2.4 Category Association Rules
- Users can assign their question sets to categories
- Multiple category assignment allowed (maximum 5 categories per question set)
- Junction table: `question_set_categories` (question_set_id, category_id)
- Only the question set owner or an admin can modify category assignments

## 3. User Management Features

### 3.1 User Actions Available to Admins
- **Ban/Suspend Users**: Disable user access to the platform
- **Reset Passwords**: Force password reset for any user
- **View Activity Logs**: Access user activity history
- **Promote to Admin**: Grant admin privileges to users

### 3.2 Ban/Suspension Implementation
- Add `status` column to users table: 'active', 'suspended'
- Add `suspended_at` and `suspended_by` columns for tracking
- Banned users cannot log in
- All content from banned users is hidden from public view
- No distinction between temporary and permanent bans

### 3.3 Activity Logging
Track the following user activities:
- Failed login attempts (with timestamp, IP address)
- Question set creation (with timestamp, question_set_id)
- Question set deletion (with timestamp, question_set_id, reason)

Store in new `activity_logs` table:
- id, user_id, action_type, details (JSON), ip_address, created_at

## 4. Analytics Dashboard

### 4.1 Key Metrics to Display
1. **Active Users**
   - Daily active users (DAU)
   - Weekly active users (WAU)
   - Monthly active users (MAU)
   - User growth trends

2. **Most Popular Question Sets**
   - By number of games played
   - By number of favorites
   - By average rating (if ratings implemented)
   - Trending question sets (recent popularity spike)

3. **Category Usage Statistics**
   - Number of question sets per category
   - Most popular categories by game plays
   - Category growth trends
   - Uncategorized question sets count

### 4.2 Dashboard Layout
- Summary cards for key metrics
- Time-based filters (last 7 days, 30 days, 90 days, all time)
- Exportable data (CSV format)
- Visual charts for trend analysis

## 5. UI/UX Implementation

### 5.1 Admin Menu Integration
- Add "Admin" menu item to existing navigation (only visible to admins)
- Admin menu sections:
  - Dashboard (analytics overview)
  - Categories (CRUD interface)
  - Users (user management)
  - Activity Logs (searchable log viewer)

### 5.2 Category Assignment UI for Users
- Add category selection to question set creation/edit forms
- Multi-select dropdown with search functionality
- Display selected categories as tags
- Validation to enforce 5-category maximum

### 5.3 Browse/Search Enhancements
- Add category filters to browse page
- Add "Uncategorized" filter option
- Display categories as tags on question set cards
- Category-based search suggestions

## 6. Database Schema Changes

### 6.1 New Tables

```sql
-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Question set categories junction table
CREATE TABLE question_set_categories (
  question_set_id UUID REFERENCES question_sets(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (question_set_id, category_id)
);

-- Activity logs table
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action_type VARCHAR(50) NOT NULL,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
```

### 6.2 Modified Tables

```sql
-- Add role and status to users table
ALTER TABLE users 
ADD COLUMN role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
ADD COLUMN status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
ADD COLUMN suspended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN suspended_by UUID REFERENCES users(id);
```

## 7. Security Considerations

### 7.1 Row Level Security (RLS)
- Categories: Read access for all, write access for admins only
- Activity logs: Read access for admins only
- User management: Admin-only access
- Question set categories: Owners and admins can modify

### 7.2 API Security
- Add role-based middleware for admin endpoints
- Validate admin status on each request
- Log all admin actions for audit trail
- Rate limiting on sensitive operations

## 8. Implementation Priority

1. **Phase 1**: Core admin system
   - Admin role implementation
   - Basic admin authentication/authorization
   - Admin menu UI

2. **Phase 2**: Category system
   - Category CRUD for admins
   - Category assignment for users
   - Browse/search integration

3. **Phase 3**: User management
   - User listing and search
   - Ban/suspend functionality
   - Password reset capability
   - Admin promotion

4. **Phase 4**: Analytics and logging
   - Activity logging implementation
   - Analytics dashboard
   - Data export functionality

## 9. Future Enhancements (Out of Scope)

- Email notifications for admin alerts
- Bulk operations (batch user management)
- Category hierarchies/subcategories
- Content moderation queue
- API rate limiting per user
- Advanced analytics with custom date ranges
- Role-based permissions (multiple admin levels)

## 10. Success Criteria

- Admins can successfully manage all categories
- Users can assign up to 5 categories to their question sets
- All admin actions are logged and auditable
- Analytics provide actionable insights
- System remains performant with large datasets
- Security is maintained throughout