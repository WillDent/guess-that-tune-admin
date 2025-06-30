# 🎧 Guess That Tune – Supabase/Next.js API & Database Adaptation Spec

## Overview

This document outlines the required changes to your Supabase/Next.js backend to support the iOS app API described in `Download guess-that-tune-api-spec.md`. The goal is to **minimize changes** by only adding new features and fields, treating "question sets" as "playlists".

---

## 1. Mapping iOS API Endpoints to Current Structure

| iOS Endpoint                              | Purpose/Notes                                                                 | Current Mapping/Required Action                |
|-------------------------------------------|-------------------------------------------------------------------------------|------------------------------------------------|
| `GET /api/home`                          | Returns categories and playlists (with stats, lock state, etc.)               | Extend categories & question sets with stats   |
| `GET /api/user/profile`                   | Returns user profile, level, XP, etc.                                         | Already present, may need XP/level fields      |
| `GET /api/category/{categoryId}/playlists`| Paginated playlists for a category                                            | Extend question sets, add pagination           |
| `GET /api/playlist/{playlistId}`          | Playlist detail, leaderboard, metadata                                        | Extend question sets, add leaderboard logic    |
| `POST /api/game/complete`                 | Submit game results, return XP, score, level-up, leaderboard position         | New game results table & endpoint              |
| `GET /api/notifications`                  | List of notifications, unread count                                           | New notifications table & endpoint             |
| `POST /api/error/log`                     | Client error reporting                                                        | New error logs table & endpoint                |

---

## 2. Database Changes

### A. Extend `question_sets` Table (Playlists)

Add the following fields:
- `unique_players` (INTEGER, default 0)
- `total_plays` (INTEGER, default 0)
- `state` (TEXT, e.g. 'NEW', 'TRENDING', 'LOCKED')
- `required_level` (INTEGER, default 0)
- `icon` (TEXT, optional)

### B. User Progression

Ensure the user table includes:
- `level` (INTEGER)
- `total_score` (INTEGER)
- `experience` (INTEGER)

### C. New Tables

#### 1. `game_results`
| Field           | Type      | Description                        |
|-----------------|-----------|------------------------------------|
| id              | UUID      | Primary key                        |
| user_id         | UUID      | References users                   |
| playlist_id     | UUID      | References question_sets           |
| correct_tracks  | INTEGER   | Number of correct answers          |
| total_tracks    | INTEGER   | Total tracks in game               |
| completion_time | INTEGER   | Time to complete (seconds)         |
| perfect_score   | BOOLEAN   | Whether all answers were correct   |
| score_awarded   | INTEGER   | Score for this game                |
| xp_awarded      | INTEGER   | XP for this game                   |
| created_at      | TIMESTAMP | When the game was completed        |

#### 2. `notifications`
| Field      | Type      | Description                        |
|------------|-----------|------------------------------------|
| id         | UUID      | Primary key                        |
| user_id    | UUID      | References users                   |
| type       | TEXT      | Notification type                  |
| title      | TEXT      | Notification title                 |
| message    | TEXT      | Notification message               |
| created_at | TIMESTAMP | When notification was created      |
| is_read    | BOOLEAN   | Read status                        |
| data       | JSONB     | Extra data (playlistId, etc.)      |

#### 3. `error_logs`
| Field         | Type      | Description                        |
|---------------|-----------|------------------------------------|
| id            | UUID      | Primary key                        |
| user_id       | UUID      | References users                   |
| error_type    | TEXT      | Error type                         |
| playlist_id   | UUID      | Optional, references question_sets |
| error_message | TEXT      | Error message                      |
| timestamp     | TIMESTAMP | When error occurred                |
| device_info   | JSONB     | Device/app info                    |

---

## 3. API Endpoints Specification

### 1. `GET /api/home`
- Returns categories and their playlists (question sets) with stats and lock state.
- Response structure matches iOS spec.

### 2. `GET /api/user/profile`
- Returns user profile, avatar, level, XP, etc.

### 3. `GET /api/category/{categoryId}/playlists`
- Returns paginated playlists (question sets) for a category.

### 4. `GET /api/playlist/{playlistId}`
- Returns playlist (question set) detail, leaderboard, and metadata.

### 5. `POST /api/game/complete`
- Accepts game result, updates stats, returns XP, score, level, leaderboard position.

### 6. `GET /api/notifications`
- Returns notifications for the user, including unread count.

### 7. `POST /api/error/log`
- Accepts error report from client, rate-limited.

---

## 4. Example Migration SQL

```sql
-- Extend question_sets table
ALTER TABLE question_sets
  ADD COLUMN unique_players INTEGER DEFAULT 0,
  ADD COLUMN total_plays INTEGER DEFAULT 0,
  ADD COLUMN state TEXT DEFAULT 'NEW',
  ADD COLUMN required_level INTEGER DEFAULT 0,
  ADD COLUMN icon TEXT;

-- Create game_results table
CREATE TABLE game_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  playlist_id UUID REFERENCES question_sets(id),
  correct_tracks INTEGER,
  total_tracks INTEGER,
  completion_time INTEGER,
  perfect_score BOOLEAN,
  score_awarded INTEGER,
  xp_awarded INTEGER,
  created_at TIMESTAMP DEFAULT now()
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type TEXT,
  title TEXT,
  message TEXT,
  created_at TIMESTAMP DEFAULT now(),
  is_read BOOLEAN DEFAULT FALSE,
  data JSONB
);

-- Create error_logs table
CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  error_type TEXT,
  playlist_id UUID,
  error_message TEXT,
  timestamp TIMESTAMP,
  device_info JSONB
);
```

---

## 5. Implementation Notes

- **JWT authentication** required for all endpoints.
- **All responses** must be JSON and match the iOS app's expected structure.
- **Leaderboard** can be derived from `game_results` (top scores per playlist).
- **XP/level logic** can be implemented in the API layer if not already present.
- **Rate limiting** should be applied to `/api/error/log`.
- **Caching** may be used for `/api/home` as needed.

---

## 6. Next Steps

1. **Write and apply the migration SQL** to update your database.
2. **Implement new API route handlers** in `/app/api/` for each endpoint.
3. **Update Supabase types** if you use type generation.
4. **Test endpoints** with mock data to ensure compatibility with the iOS app.

---

**If you need detailed handler skeletons, OpenAPI specs, or further breakdowns, let me know!** 