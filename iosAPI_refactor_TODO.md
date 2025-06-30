# 📋 Refactor & Test Expansion TODO: `/api/game/complete`

This document outlines the plan to refactor and expand test coverage for the `/api/game/complete` endpoint, ensuring robust business logic, validation, and maintainability. It draws on best practices from the codebase and Next.js documentation.

---

## 1. Refactor `/api/game/complete` Endpoint

### Goals
- Use shared utilities for XP/level calculation, input validation, stats, and leaderboard logic.
- Improve maintainability and consistency across endpoints.
- Prepare for easier future changes to business logic.

### Steps
- [x] **Replace inline XP/level logic**
  - Use `lib/xp.ts` for XP/level calculation and progression.
- [x] **Replace inline input validation**
  - Use Zod schemas and `lib/validation.ts` for request validation.
- [x] **Use shared stats and leaderboard utilities**
  - Use `lib/stats.ts` for playlist stats updates.
  - Use `lib/leaderboard.ts` for leaderboard position calculation.
- [x] **(Optional) Add rate limiting**
  - Use `lib/rate-limit.ts` if abuse is a concern.
- [x] **Improve error handling**
  - Use try/catch and return clear error messages and status codes.

---

## 2. Expand Test Coverage

### Goals
- Ensure all business logic is covered by unit tests.
- Add integration tests for all edge cases and error conditions.
- Use mocks for Supabase and external dependencies.

### Steps
- [x] **Add/expand unit tests**
  - For XP/level calculation (if not already present).
  - For stats and leaderboard utilities.
- [x] **Expand integration tests in `tests/ios-api/game-complete.test.ts`**
  - [x] Level-up scenarios (crossing XP threshold, multiple level-ups).
  - [x] Invalid/missing input fields (should return 400).
  - [x] Database errors (should return 500 or appropriate error).
  - [x] Edge cases (first play vs. repeat play, perfect score, etc.).
  - [x] Auth edge cases (expired/malformed token).
- [x] **Ensure all business logic is tested in isolation**
  - Use Jest mocks and utility functions as in `tests/utils/supabase-mock.ts`.

---

## 3. Update Documentation & TODOs

- [x] Mark XP/level system as implemented in `iOSAPI_TODO.md` (see main TODO for details)
- [x] Note use of shared utilities in code comments and docs
- [ ] **Update OpenAPI spec and add usage examples for `/api/game/complete`**

---

## 4. (Optional) Add Rate Limiting

- [x] If abuse is a concern, add rate limiting as with `/api/error/log`.

---

## Rationale & Best Practices

- **Validation:** Use Zod schemas for robust, maintainable input validation ([Next.js docs](https://nextjs.org/docs/13/pages/building-your-application/data-fetching/forms-and-mutations)).
- **Business Logic:** Centralize XP/level, stats, and leaderboard logic in shared utilities for consistency and testability.
- **Testing:** Cover all business logic with unit tests, and all endpoint behaviors with integration tests. Use mocks for external dependencies.
- **Error Handling:** Use try/catch and return clear, actionable error messages.
- **Security:** Always check authentication and authorization before mutating data.

---

**This plan ensures `/api/game/complete` is robust, maintainable, and ready for production and future changes.** 