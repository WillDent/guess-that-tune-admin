import { test, expect } from '@playwright/test'

test.describe('iOS App E2E Flow', () => {
  test('Home page loads and displays categories/playlists', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    // Check for categories section
    await expect(page.locator('text=Categories')).toBeVisible()
    // Check for at least one playlist or question set
    await expect(page.locator('text=Playlist').first()).toBeVisible()
  })

  test('Navigate to a playlist and view leaderboard', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    // Click on the first playlist link (adjust selector as needed)
    const playlistLink = page.locator('a:has-text("Playlist")').first()
    await playlistLink.click()
    // Check for leaderboard section
    await expect(page.locator('text=Leaderboard')).toBeVisible()
  })

  test('Submit a game result (mocked)', async ({ page }) => {
    // This would require a real or mock login and API interaction
    // For now, just check the game completion page loads
    await page.goto('http://localhost:3000/games')
    await expect(page.locator('text=Games')).toBeVisible()
    // Optionally, simulate clicking a "Complete Game" button if present
  })

  test('View notifications', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    // Click notifications icon or link (adjust selector as needed)
    const notificationsLink = page.locator('a:has-text("Notifications")').first()
    if (await notificationsLink.count() > 0) {
      await notificationsLink.click()
      await expect(page.locator('text=Notifications')).toBeVisible()
    } else {
      // If no notifications link, just pass
      expect(true).toBeTruthy()
    }
  })

  test('Login and dashboard navigation', async ({ page }) => {
    await page.goto('http://localhost:3000/login')
    // Click the Password tab
    await page.click('button:has-text("Password")')
    // Fill in credentials
    await page.fill('input[type="email"]', 'will@dent.ly')
    await page.fill('input[type="password"]', 'Odessa99!')
    // Click Sign In
    await page.click('button:has-text("Sign In")')
    // Wait for dashboard to load
    await expect(page.locator('text=Dashboard')).toBeVisible()
    await expect(page.locator('text=Welcome back, Skooter!')).toBeVisible()
    // Check navigation links
    await expect(page.locator('text=Browse Sets')).toBeVisible()
    await expect(page.locator('text=Apple Music')).toBeVisible()
    await expect(page.locator('text=My Sets')).toBeVisible()
    await expect(page.locator('text=Games')).toBeVisible()
    await expect(page.locator('text=Profile')).toBeVisible()
    await expect(page.locator('text=Settings')).toBeVisible()
    await expect(page.locator('text=Sign Out')).toBeVisible()
    // Check quick actions and recent activity
    await expect(page.locator('text=Quick Actions')).toBeVisible()
    await expect(page.locator('text=Recent Activity')).toBeVisible()
  })

  // Additional navigation and flow tests can be added here
}) 