# Guess That Tune - Playlist-Based Home Page Specification

## Overview
This specification defines a new home page design that replaces the original game interface with a playlist selection system. Users select categorized playlists that launch the alternate game mode (artist guessing game).

## Architecture Overview
- **Authentication**: JWT tokens
- **API Pattern**: RESTful with JSON responses
- **Client**: iOS App (SwiftUI)

## User Flow
1. **Home Page** → View categorized playlists
2. **Playlist Selection** → Tap playlist card
3. **Playlist Detail Page** → View details, leaderboard, start game
4. **Game Play** → Alternate game mode with selected playlist
5. **Results Screen** → Score, XP earned, share options

## Home Page Structure

### Header Section
- **Player Avatar** (image URL from API)
- **Username** (string)
- **Current Level** (integer, starts at 0)
- **Total Score** (integer)
- **Settings Button** (navigates to settings)
- **Notifications Icon** (with badge count for unread)

### Content Sections
Dynamic categories provided by API, each containing:
- **Category Name** (e.g., "GENRE", "ERA", "VIBES")
- **Category Icon** (emoji or icon identifier)
- **VIEW ALL** button (links to paginated view)
- **Up to 4 playlist cards** per category

### Playlist Card Display
Each card shows:
- **Playlist Name**
- **Icon/Emoji** (from API)
- **Background** (gradient/image from app assets)
- **Player Count** (unique players who played)
- **Play Count** (total times played)
- **Visual State Badge** (NEW, TRENDING, LOCKED)

## API Endpoints

### 1. GET /api/home
Returns home page data with categories and playlists.

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "categories": [
    {
      "id": "genre_category",
      "name": "GENRE",
      "icon": "🎵",
      "playlists": [
        {
          "id": "playlist_001",
          "name": "Pop Hits",
          "icon": "🎵",
          "uniquePlayers": 7200,
          "totalPlays": 16500,
          "state": "TRENDING",
          "requiredLevel": 0,
          "isLocked": false
        },
        {
          "id": "playlist_002",
          "name": "Hip-Hop Throwbacks",
          "icon": "🎤",
          "uniquePlayers": 8400,
          "totalPlays": 21900,
          "state": null,
          "requiredLevel": 3,
          "isLocked": true
        }
        // ... up to 4 playlists
      ]
    }
    // ... more categories
  ]
}
```

### 2. GET /api/user/profile
Returns user profile information.

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "userId": "user_123",
  "username": "PlayerOne",
  "avatarUrl": "https://api.example.com/avatars/user_123.jpg",
  "level": 5,
  "totalScore": 125000,
  "experience": {
    "current": 450,
    "required": 1000,
    "percentage": 45
  }
}
```

### 3. GET /api/category/{categoryId}/playlists
Paginated endpoint for "VIEW ALL" functionality.

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Query Parameters:**
- `page` (integer, default: 1)
- `limit` (integer, default: 10)

**Response:**
```json
{
  "playlists": [
    // ... array of playlist objects (same structure as home endpoint)
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 47,
    "hasMore": true
  }
}
```

### 4. GET /api/playlist/{playlistId}
Returns detailed playlist information for intermediate page.

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "id": "playlist_001",
  "name": "Pop Hits",
  "description": "Test your knowledge of the biggest pop hits from the last decade",
  "icon": "🎵",
  "difficultyRating": {
    "value": 3,
    "display": "Medium",
    "maxValue": 5
  },
  "totalPlays": 16500,
  "requiredLevel": 0,
  "isLocked": false,
  "trackCount": 20,
  "estimatedDuration": "10-15 minutes",
  "leaderboard": [
    {
      "rank": 1,
      "username": "MusicMaster",
      "correctTracks": 19,
      "totalTracks": 20,
      "completionTime": 485,
      "displayTime": "8:05"
    },
    {
      "rank": 2,
      "username": "PopExpert",
      "correctTracks": 18,
      "totalTracks": 20,
      "completionTime": 512,
      "displayTime": "8:32"
    }
    // ... top 5 entries
  ]
}
```

### 5. POST /api/game/complete
Submits game results and receives XP calculation.

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Request Body:**
```json
{
  "playlistId": "playlist_001",
  "correctTracks": 18,
  "totalTracks": 20,
  "completionTime": 523,
  "perfectScore": false
}
```

**Response:**
```json
{
  "score": 18000,
  "experienceAwarded": 250,
  "newLevel": 6,
  "leveledUp": true,
  "leaderboardPosition": 3,
  "shareText": "I scored 18/20 on Pop Hits in 8:43! Can you beat my score? Play Guess That Tune: {app_link}"
}
```

### 6. GET /api/notifications
Returns user notifications.

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
```

**Response:**
```json
{
  "notifications": [
    {
      "id": "notif_001",
      "type": "NEW_PLAYLIST",
      "title": "New Playlist Available!",
      "message": "Check out '2010s Rock Anthems' in the ERA category",
      "createdAt": "2024-01-15T10:30:00Z",
      "isRead": false,
      "data": {
        "playlistId": "playlist_050",
        "categoryId": "era_category"
      }
    }
  ],
  "unreadCount": 3
}
```

### 7. POST /api/error/log
Reports client-side errors to API.

**Headers:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

**Request Body:**
```json
{
  "errorType": "CORRUPT_PLAYLIST_DATA",
  "playlistId": "playlist_001",
  "errorMessage": "Missing track data",
  "timestamp": "2024-01-15T10:30:00Z",
  "deviceInfo": {
    "platform": "iOS",
    "version": "17.0",
    "appVersion": "1.0.0"
  }
}
```

## Error Handling

### Client-Side Error Messages
1. **Corrupt/Missing Playlist Data**: "Oops, this is embarrassing. Please try another playlist."
2. **No Internet Connection**: "An internet connection is required to play."
3. **API Errors**: "Something went wrong. Please try again."

### Error Reporting
All errors should be logged to `/api/error/log` endpoint for tracking.

## Game States and Rules

### Playlist Locking
- Playlists can be locked based on player level
- Locked playlists show "Unlocks at Level X" message
- If player level decreases, previously unlocked playlists become locked again

### Experience Points Calculation (API-side)
XP awarded based on:
- **Completion Percentage**: (correctTracks / totalTracks) * baseXP
- **Perfect Score Bonus**: Additional XP for 100% accuracy
- **Time Bonus**: Faster completion grants bonus XP
- **Level Requirements**: Increasing XP needed per level (e.g., Level 1: 100 XP, Level 2: 250 XP, Level 3: 500 XP)

### Visual States
- **NEW**: Playlist added within last 7 days
- **TRENDING**: High play count in recent period
- **LOCKED**: Requires higher player level

## UI Behaviors

### Home Page
- Load user profile and home data on app launch
- Show skeleton loaders while loading
- Display maximum 4 playlists per category
- "VIEW ALL" navigates to category-specific view

### Category View (VIEW ALL)
- Initial load: 10 playlists
- Infinite scroll: Load 10 more when near bottom
- Show skeleton loaders during pagination
- Sort by newest first

### Playlist Detail Page
- Show all playlist information
- Display top 5 leaderboard entries
- "START GAME" button (disabled if locked)
- Back button returns to home page

### Results Screen
- Display final score and statistics
- Show XP earned with level progress
- Share button with pre-formatted text
- Options: Play Again, Share, Return to Home

### Notifications
- Badge shows unread count
- Notifications expire after 30 days
- Tap notification to view relevant playlist
- Mark as read when viewed

## Technical Considerations

### Performance
- Cache home page data for quick loading
- Implement pull-to-refresh on home page
- Preload playlist details when possible

### Security
- All API calls require valid JWT token
- Validate playlist access against user level
- Implement rate limiting for error reporting

### Offline Behavior
- Show cached home page if available
- Display connection error for all actions
- Queue score submissions for when online (optional enhancement)

## Future Enhancements (Not in V1)
- Friend challenges
- Daily rewards
- Achievement system
- Custom playlists
- Multiplayer mode
- Additional notification types
- Filtering and search functionality