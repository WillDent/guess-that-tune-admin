# 🎧 Guess That Tune iOS API – Developer Integration Guide

## Overview

This document provides everything you need to integrate the Guess That Tune iOS app with the Supabase/Next.js backend. It includes:

- High-level API and database mapping
- Implementation and testing checklist
- Business logic and rate limiting notes
- Usage examples for key endpoints
- **Full OpenAPI YAML** (see end of document) for all endpoints, request/response types, and error codes

---

## 1. API & Database Mapping

See [`iOSAPISpecs.md`](iOSAPISpecs.md) for full details. Key points:

| iOS Endpoint                              | Purpose/Notes                                                                 | Backend Mapping/Action                |
|-------------------------------------------|-------------------------------------------------------------------------------|---------------------------------------|
| `GET /api/home`                          | Returns categories and playlists (with stats, lock state, etc.)               | Extend categories & question sets     |
| `GET /api/user/profile`                   | Returns user profile, level, XP, etc.                                         | Add XP/level fields if needed         |
| `GET /api/category/{categoryId}/playlists`| Paginated playlists for a category                                            | Add pagination, stats                 |
| `GET /api/playlist/{playlistId}`          | Playlist detail, leaderboard, metadata                                        | Add leaderboard logic                 |
| `POST /api/game/complete`                 | Submit game results, return XP, score, level-up, leaderboard position         | New game results table & endpoint     |
| `GET /api/notifications`                  | List of notifications, unread count                                           | New notifications table & endpoint    |
| `POST /api/error/log`                     | Client error reporting                                                        | New error logs table & endpoint       |

**Database changes**: See migration SQL in the spec for new fields/tables.

---

## 2. Implementation & Testing Checklist

See [`iOSAPI_TODO.md`](iOSAPI_TODO.md) for full progress and conventions.

- **All endpoints**: JWT authentication required, robust Zod validation, and clear error handling.
- **Business logic**: Centralized in utilities (`lib/xp.ts`, `lib/leaderboard.ts`, `lib/stats.ts`, etc.), fully unit tested.
- **Rate limiting**: Sensitive endpoints (e.g., `/api/game/complete`, `/api/error/log`) are rate-limited (10 requests/min/user).
- **Testing**: All business logic and endpoints have comprehensive unit and integration tests (`tests/utils/`, `tests/ios-api/`).

---

## 3. Business Logic & Rate Limiting

- **XP/Level Calculation**: Handled by `lib/xp.ts`, with progression and multi-level-up support.
- **Leaderboard**: Derived from `game_results` table, logic in `lib/leaderboard.ts`.
- **Stats**: Playlist stats updated via `lib/stats.ts`.
- **Rate Limiting**: Implemented via `lib/rate-limit.ts`, returns HTTP 429 with error message if exceeded.

---

## 4. Example Usage: `/api/game/complete`

- **Request:**
  ```json
  {
    "playlist_id": "abc123",
    "correct_tracks": 8,
    "total_tracks": 10,
    "completion_time": 120,
    "perfect_score": false
  }
  ```
- **Response:**
  ```json
  {
    "xp_awarded": 80,
    "score_awarded": 800,
    "new_level": 2,
    "leaderboard_position": 5
  }
  ```
- **Rate Limit Exceeded:**
  ```json
  {
    "error": "Rate limit exceeded. Please wait before submitting again."
  }
  ```

---

## 5. Implementation Progress

See [`PROGRESS.md`](PROGRESS.md) for a full summary of completed features, technical stack, and next steps.

---

## 6. Full OpenAPI YAML

<details>
<summary>Click to expand full OpenAPI YAML</summary>

```yaml
openapi: 3.1.0
info:
  title: Guess That Tune iOS API
  version: 1.0.0
  description: API for Guess That Tune iOS app, mapped to Supabase/Next.js backend.

servers:
  - url: https://your-api-domain.com/api

tags:
  - name: Home
  - name: User
  - name: Category
  - name: Playlist
  - name: Game
  - name: Notifications
  - name: ErrorLog

paths:
  /home:
    get:
      tags: [Home]
      summary: Get home data (categories and playlists)
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Home data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/HomeResponse'

  /user/profile:
    get:
      tags: [User]
      summary: Get user profile
      security:
        - bearerAuth: []
      responses:
        '200':
          description: User profile
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserProfile'

  /category/{categoryId}/playlists:
    get:
      tags: [Category]
      summary: Get playlists for a category
      security:
        - bearerAuth: []
      parameters:
        - name: categoryId
          in: path
          required: true
          schema:
            type: string
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: pageSize
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: Paginated playlists
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PlaylistListResponse'

  /playlist/{playlistId}:
    get:
      tags: [Playlist]
      summary: Get playlist details and leaderboard
      security:
        - bearerAuth: []
      parameters:
        - name: playlistId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Playlist details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PlaylistDetailResponse'

  /game/complete:
    post:
      tags: [Game]
      summary: Submit game results (rate limited: 10 requests per minute per user)
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/GameCompleteRequest'
            examples:
              typical:
                summary: Typical game completion request
                value:
                  playlist_id: "abc123"
                  correct_tracks: 8
                  total_tracks: 10
                  completion_time: 120
                  perfect_score: false
      responses:
        '200':
          description: Game completion result
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GameCompleteResponse'
              examples:
                typical:
                  summary: Typical game completion response
                  value:
                    xp_awarded: 80
                    score_awarded: 800
                    new_level: 2
                    leaderboard_position: 5
        '429':
          description: Too many requests (rate limit exceeded)
          content:
            application/json:
              schema:
                type: object
                properties:
                  error:
                    type: string
              examples:
                rateLimit:
                  summary: Rate limit exceeded response
                  value:
                    error: Rate limit exceeded. Please wait before submitting again.

  /notifications:
    get:
      tags: [Notifications]
      summary: Get user notifications
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Notifications list
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/NotificationsResponse'

  /error/log:
    post:
      tags: [ErrorLog]
      summary: Log a client error
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ErrorLogRequest'
      responses:
        '204':
          description: Error logged

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    HomeResponse:
      type: object
      properties:
        categories:
          type: array
          items:
            $ref: '#/components/schemas/Category'
        playlists:
          type: array
          items:
            $ref: '#/components/schemas/Playlist'

    Category:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        icon:
          type: string

    Playlist:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        icon:
          type: string
        state:
          type: string
          enum: [NEW, TRENDING, LOCKED, NORMAL]
        required_level:
          type: integer
        unique_players:
          type: integer
        total_plays:
          type: integer

    UserProfile:
      type: object
      properties:
        id:
          type: string
        username:
          type: string
        avatar_url:
          type: string
        level:
          type: integer
        experience:
          type: integer
        total_score:
          type: integer

    PlaylistListResponse:
      type: object
      properties:
        playlists:
          type: array
          items:
            $ref: '#/components/schemas/Playlist'
        page:
          type: integer
        pageSize:
          type: integer
        total:
          type: integer

    PlaylistDetailResponse:
      type: object
      properties:
        playlist:
          $ref: '#/components/schemas/Playlist'
        leaderboard:
          type: array
          items:
            $ref: '#/components/schemas/LeaderboardEntry'

    LeaderboardEntry:
      type: object
      properties:
        user_id:
          type: string
        username:
          type: string
        score:
          type: integer
        rank:
          type: integer

    GameCompleteRequest:
      type: object
      required: [playlist_id, correct_tracks, total_tracks, completion_time, perfect_score]
      properties:
        playlist_id:
          type: string
        correct_tracks:
          type: integer
        total_tracks:
          type: integer
        completion_time:
          type: integer
        perfect_score:
          type: boolean

    GameCompleteResponse:
      type: object
      properties:
        xp_awarded:
          type: integer
        score_awarded:
          type: integer
        new_level:
          type: integer
        leaderboard_position:
          type: integer

    NotificationsResponse:
      type: object
      properties:
        notifications:
          type: array
          items:
            $ref: '#/components/schemas/Notification'
        unread_count:
          type: integer

    Notification:
      type: object
      properties:
        id:
          type: string
        type:
          type: string
        title:
          type: string
        message:
          type: string
        created_at:
          type: string
          format: date-time
        is_read:
          type: boolean
        data:
          type: object

    ErrorLogRequest:
      type: object
      required: [error_type, error_message, device_info]
      properties:
        error_type:
          type: string
        playlist_id:
          type: string
        error_message:
          type: string
        device_info:
          type: object 
```
</details>

---

## 7. Additional Notes

- **All endpoints require JWT Bearer authentication.**
- **All responses are JSON.**
- **Contact the backend team for any questions or if you need further examples or test tokens.**

---

**This document is your single source of truth for integrating the iOS app with the backend.** If you need further breakdowns, handler skeletons, or test data, just ask! 