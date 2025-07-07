# Supabase Authentication & User Profile iOS Implementation Plan

## Overview
This plan outlines the iOS-specific implementation of user authentication and profile management for Guess That Tune using Supabase's Swift SDK. This assumes an existing Supabase project with authentication and database already configured.

## Phase 1: iOS Project Setup

### 1.1 Package Dependencies
- Add Supabase Swift SDK to Package.swift
- Version: Latest stable (currently 2.x)
- Required modules: Auth, Database, Storage

### 1.2 Configuration Setup
- Add Supabase URL and anon key to environment configuration
- Create secure storage for API keys (avoid hardcoding)
- Set up URL scheme for authentication callbacks in Info.plist
- Configure deep linking for magic link authentication

## Phase 2: Core Authentication Implementation

### 2.1 Supabase Client Configuration
**File**: `SupabaseManager.swift`
- Singleton manager for Supabase client
- Environment-based configuration (dev/prod)
- Session management utilities

### 2.2 Authentication Service
**File**: `SupabaseAuthService.swift`
- Sign up with email/password
- Sign in with email/password
- Sign out functionality
- Password reset flow
- Session persistence and refresh
- Deep link handling for magic links

### 2.3 Profile Service
**File**: `ProfileService.swift`
- Fetch user profile
- Update profile information
- Upload/update avatar image
- Delete account functionality

## Phase 3: UI Implementation

### 3.1 Authentication Flow
**New Views**:
- `SignInView.swift` - Email/password sign in
- `SignUpView.swift` - Account creation
- `ForgotPasswordView.swift` - Password reset
- `AuthenticationView.swift` - Container for auth flows

**Integration Points**:
- Update `HomeView` to show sign in/profile button
- Add authentication state check on app launch
- Protect game features behind authentication (optional)

### 3.2 Profile Management
**New Views**:
- `ProfileView.swift` - Main profile display/edit
- `ProfilePhotoPickerView.swift` - Avatar selection
- `AccountSettingsView.swift` - Account management options

**Features**:
- Display username, full name, avatar
- Edit profile information
- Change password
- Delete account
- Sign out

### 3.3 Navigation Updates
```
HomeView
├── Sign In Button (when not authenticated)
│   └── AuthenticationView
│       ├── SignInView
│       ├── SignUpView
│       └── ForgotPasswordView
├── Profile Button (when authenticated)
│   └── ProfileView
│       ├── Edit Profile
│       ├── Account Settings
│       └── Sign Out
└── Play Button
    └── QuizSelectionView (existing)
```

## Phase 4: State Management

### 4.1 Authentication State
- Create `@Observable AuthenticationState` class
- Track current user session
- Handle authentication state changes
- Persist session across app launches

### 4.2 Profile State
- Create `@Observable ProfileState` class
- Cache user profile data
- Handle profile updates
- Manage avatar uploads

### 4.3 App-wide Integration
- Update `GuessTheTuneApp.swift` to initialize Supabase
- Add authentication state to environment
- Handle deep links for authentication

## Phase 5: Enhanced Features

### 5.1 Game Statistics Integration
- Track games played per user
- Store high scores
- Record favorite artists based on gameplay
- Display stats in profile

### 5.2 Social Features (Future)
- Leaderboards
- Friend challenges
- Share quiz results
- Compare stats with friends

### 5.3 Personalization
- Save favorite quizzes
- Track quiz completion
- Personalized quiz recommendations
- Resume interrupted games

## Phase 6: Security & Error Handling

### 6.1 Security Measures
- Implement proper RLS policies
- Validate user inputs
- Secure API key storage
- Handle session expiration gracefully

### 6.2 Error Handling
- Network error recovery
- Authentication error messages
- Profile update failures
- Image upload errors

### 6.3 Testing Considerations
- Unit tests for auth flows
- Integration tests for Supabase
- UI tests for sign in/sign up
- Profile update scenarios

## Phase 7: Integration & Migration

### 7.1 Existing User Considerations
- Optional authentication (don't force existing users)
- Guest mode for playing without account
- Prompt to create account after games
- Preserve existing game flow

### 7.2 Environment Configuration
- Use existing Supabase project credentials
- Environment-specific configurations (dev/staging/prod)
- Secure storage of API keys using Xcode configuration files
- Build scheme configuration for different environments

## Technical Considerations

### Dependencies
- Supabase Swift SDK
- Keychain for secure storage
- PhotosUI for avatar selection

### Architecture Changes
- Add Services/Supabase directory
- Create Models/Profile directory
- Update existing AuthService to support Supabase
- Maintain backward compatibility

### UI/UX Guidelines
- Consistent with existing app design
- Smooth authentication flow
- Clear error messages
- Loading states for async operations
- Offline capability considerations

## Implementation Priority

1. **MVP Features** (Phase 1-3)
   - Basic authentication (sign up/sign in/sign out)
   - Simple profile view/edit
   - Avatar upload

2. **Enhanced Features** (Phase 4-5)
   - Game statistics
   - Profile customization
   - Social features prep

3. **Polish** (Phase 6-7)
   - Error handling refinement
   - Performance optimization
   - Analytics integration

## Estimated Effort (iOS Only)

- **Phase 1**: 1 day (iOS Project Setup)
- **Phase 2**: 2 days (Core Services Implementation)
- **Phase 3**: 3-4 days (UI Implementation)
- **Phase 4**: 1-2 days (State Management)
- **Phase 5**: 3-4 days (Enhanced Features)
- **Phase 6-7**: 2 days (Testing & Integration)

**Total**: ~2 weeks for iOS implementation

## Implementation Checklist

### Immediate Tasks
1. [ ] Add Supabase Swift SDK to Package.swift
2. [ ] Configure URL schemes in Info.plist
3. [ ] Create SupabaseManager.swift with client configuration
4. [ ] Implement SupabaseAuthService.swift
5. [ ] Build SignInView and SignUpView
6. [ ] Update HomeView with authentication state
7. [ ] Create ProfileView with basic info display
8. [ ] Test authentication flow end-to-end

### Follow-up Tasks
1. [ ] Add avatar upload functionality
2. [ ] Implement profile editing
3. [ ] Add password reset flow
4. [ ] Create account settings view
5. [ ] Integrate game statistics
6. [ ] Add proper error handling
7. [ ] Implement session persistence
8. [ ] Add loading states and animations

## Required Information from Backend

Before starting iOS implementation, confirm:
- Supabase project URL
- Supabase anon key
- Database schema for profiles table
- Storage bucket name for avatars
- Any custom RLS policies or functions
- Expected profile data structure