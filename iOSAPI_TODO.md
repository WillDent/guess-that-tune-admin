# 📋 TODO: Implement iOS API Support for Guess That Tune

> **Progress update:**
> - XP/level calculation utility implemented in `lib/xp.ts`, tested in `tests/utils/xp-calc.test.ts`.
> - Leaderboard utility implemented in `lib/leaderboard.ts`, tested in `tests/utils/leaderboard-utils.test.ts`.
> - Notification logic implemented in `lib/notifications.ts`, tested in `tests/utils/notifications.test.ts`.
> - Playlist locking logic implemented in `lib/playlist-lock.ts`, tested in `tests/utils/playlist-lock.test.ts`.
> - Stats tracking logic implemented in `lib/stats.ts`, tested in `tests/utils/stats.test.ts`.
> - JWT authentication helpers implemented in `lib/auth/require-auth.ts`, tested in `tests/utils/require-auth.test.ts`.
> - Rate limiting implemented in `lib/rate-limit.ts`, tested in `tests/utils/rate-limit.test.ts`.
> - Input validation implemented in `lib/validation.ts`, tested in `tests/utils/validation.test.ts`.
> - **XP/level system, stats, and leaderboard logic now use shared utilities and are fully tested.**

This document outlines all tasks required to implement the iOS API as specified in `iOSAPISpecs.md` and `docs/openapi.yaml`. Tasks are grouped by area: database, API endpoints, business logic, and testing.

---

## 1. Database Migration

- [x] **Extend `question_sets` table**
  - [x] Add `unique_players` (INTEGER, default 0)
  - [x] Add `total_plays` (INTEGER, default 0)
  - [x] Add `state` (TEXT, e.g. 'NEW', 'TRENDING', 'LOCKED')
  - [x] Add `required_level` (INTEGER, default 0)
  - [x] Add `icon` (TEXT, optional)

- [x] **User Progression**
  - [x] Ensure user table has `level`, `total_score`, `experience` fields

- [x] **Create new tables**
  - [x] `game_results` (see spec for fields)
  - [x] `notifications` (see spec for fields)
  - [x] `error_logs` (see spec for fields)

- [x] **Write and apply migration SQL**

---

## 2. API Endpoints Implementation

- [x] **/api/home**
  - [x] Return categories and playlists (question sets) with stats and lock state
  - [x] Ensure response matches iOS spec

- [x] **/api/user/profile**
  - [x] Return user profile, avatar, level, XP, etc.

- [x] **/api/category/{categoryId}/playlists**
  - [x] Return paginated playlists for a category

- [x] **/api/playlist/{playlistId}**
  - [x] Return playlist (question set) detail, leaderboard, and metadata
  - [x] Implement leaderboard logic (top scores per playlist)

- [x] **/api/game/complete**
  - [x] Accept game result, update stats, return XP, score, level, leaderboard position
  - [x] Implement XP/level logic using shared utility (`lib/xp.ts`)
  - [x] Use shared stats and leaderboard utilities (`lib/stats.ts`, `lib/leaderboard.ts`)
  - [x] Fully tested with unit and integration tests

- [x] **/api/notifications**
  - [x] Return notifications for the user, including unread count

- [x] **/api/error/log**
  - [x] Accept error report from client
  - [x] Add rate limiting

---

## 3. Business Logic & Features

- [x] **Leaderboard**
  - [x] Derive leaderboard from `game_results` (top scores per playlist)
  - _Implemented in `lib/leaderboard.ts`, tested in `tests/utils/leaderboard-utils.test.ts`._

- [x] **XP/Level System**
  - [x] Implement XP/level calculation and progression logic using shared utility (`lib/xp.ts`)
  - [x] Fully tested in isolation and via endpoint integration tests

- [x] **Notification System**
  - [x] Add logic to create and mark notifications as read
  - _Implemented in `lib/notifications.ts`, tested in `tests/utils/notifications.test.ts`._

- [x] **Playlist Locking**
  - [x] Enforce `required_level` and `state` for playlist access
  - _Implemented in `lib/playlist-lock.ts`, tested in `tests/utils/playlist-lock.test.ts`._

- [x] **Stats Tracking**
  - [x] Update `unique_players` and `total_plays` on playlist/game completion using shared utility (`lib/stats.ts`)
  - [x] Fully tested in isolation and via endpoint integration tests

---

## 4. Security & Middleware

- [x] **JWT Authentication**
  - [x] Require JWT auth for all endpoints
  - _requireAuth/requireAdmin helpers in `lib/auth/require-auth.ts`, tested in `tests/utils/require-auth.test.ts`._

- [x] **Rate Limiting**
  - [x] Apply to `/api/error/log` and other sensitive endpoints
  - _Implemented in `lib/rate-limit.ts`, tested in `tests/utils/rate-limit.test.ts`._

- [x] **Input Validation**
  - [x] Validate all incoming request bodies and parameters
  - _Implemented in `lib/validation.ts`, tested in `tests/utils/validation.test.ts`._

---

## 5. Testing

- [x] **Unit Tests**
  - [x] For leaderboard utility (`leaderboard-utils.test.ts`)
  - [x] For notification logic (`notifications.test.ts`)
  - [x] For playlist locking logic (`playlist-lock.test.ts`)
  - [x] For stats tracking logic (`stats.test.ts`)
  - [x] For JWT authentication helpers (`require-auth.test.ts`)
  - [x] For rate limiting (`rate-limit.test.ts`)
  - [x] For input validation (`validation.test.ts`)
  - [x] For all new business logic (XP, etc.)
  - [x] Place all unit tests in `tests/utils/` or a new `tests/unit/` directory.
  - [x] Follow the structure and conventions used in `tests/utils/supabase-mock.ts` (export utility functions, use named exports, and keep tests focused and isolated).
  - [x] Use descriptive filenames, e.g. `xp-calc.test.ts`, `leaderboard-utils.test.ts`, etc.
  - [x] Mock external dependencies (e.g. Supabase, network calls) using Jest mocks or utility functions.
  - [x] Ensure all business logic functions are covered by unit tests, not just API endpoints.

- [x] **Integration Tests**
  - [x] For all new API endpoints (see `tests/ios-api/` for structure)
  - [x] Test authentication, error handling, and edge cases

- [ ] **End-to-End Tests**
  - [ ] Simulate iOS app flows (home, play game, submit results, view leaderboard, notifications)

---

## 6. Documentation

- [ ] **Update API docs**
  - [ ] Ensure `docs/openapi.yaml` is up to date with implementation
  - [ ] Add usage examples for each endpoint

- [ ] **Developer Notes**
  - [ ] Document any new environment variables or configuration
  - [ ] Add migration instructions

---

## 7. Deployment

- [ ] **Apply database migrations to all environments**
- [ ] **Deploy updated API**
- [ ] **Monitor logs for errors and performance**

---

## 8. Optional Enhancements

- [ ] **Caching for /api/home**
- [ ] **Admin endpoints for managing notifications or playlists**
- [ ] **Analytics for playlist/game usage**

---

**If you need detailed breakdowns for any section, or want code skeletons for endpoints, let me know!** 