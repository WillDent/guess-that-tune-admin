import { test, expect } from '@playwright/test';

test('user can log in with email and password', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.click('button[value="password"]');
  await page.fill('input[type="email"]', 'will@dent.ly');
  await page.fill('input[type="password"]', 'Odessa99!');
  await page.click('button[type="submit"]');
  // Wait for navigation or a user-specific element
  await page.waitForURL('**/settings', { timeout: 10000 });
  await expect(page).toHaveURL(/settings/);
  // Optionally, check for a user-specific element/text
  // await expect(page.locator('text=Your Profile')).toBeVisible();
}); 