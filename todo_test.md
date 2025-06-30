# 🧪 Test TODOs for Guess That Tune Admin

This document summarizes all remaining test-related items based on the latest test run and current project state.

---

## 1. Failing Test Suites & Issues

### 1.1. error-log.test.ts
- **Failing Test:** should accept error log from authenticated user
- **Reason:**
  - `expect([200, 201]).toContain(res.status);` fails because the response status is 400 (Bad Request), not 200/201.
- **Action:**
  - Review the POST handler and test mock data for required fields. Ensure the test sends all required fields and the mock returns a successful insert.

### 1.2. category-playlists.test.ts
- **Failing Tests:**
  - should return 401 if not authenticated
- **Reason:**
  - `TypeError: Cannot read properties of undefined (reading 'select')` — the Supabase mock for `.from()` is not set up for this test, so it returns undefined.
- **Action:**
  - Ensure the Supabase mock returns an object with a `select` method for all `.from()` calls, even for unauthenticated cases.

### 1.3. playlist.test.ts
- **Failing Tests:**
  - should return 401 if not authenticated
  - should return playlist details for authenticated user
- **Reasons:**
  - `TypeError: Cannot read properties of undefined (reading 'select')` — missing mock for `.from()`
  - `TypeError: ...order is not a function` — the mock chain for `.order` is not set up.
- **Action:**
  - Update the Supabase mock to provide the full method chain: `.from().select().eq().order().limit()` as needed by the handler.

### 1.4. game-complete.test.ts
- **Failing Test:** should accept game result and return stats for authenticated user
- **Reason:**
  - `expect(res.status).toBe(200);` but received 400 (Bad Request). Likely due to missing or incorrect mock data or required fields in the request body.
- **Action:**
  - Review the POST handler and test mock data. Ensure all required fields are present and the mock returns a successful result.

---

## 2. General Test Improvements
- [ ] Review and update all Supabase mocks to match the actual method chains used in handlers.
- [ ] Ensure all required request fields are present in test cases (especially for POST requests).
- [ ] Add/expand tests for edge cases and error handling as needed.
- [ ] Consider adding more integration tests for business logic (XP, leaderboard, notifications, etc.) if not already covered.

---

## 3. Passed Test Suites
- home.test.ts
- profile.test.ts
- notifications.test.ts

---

**Once the above issues are addressed, all tests should pass in the current environment.** 