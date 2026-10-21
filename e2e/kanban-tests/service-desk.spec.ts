import { test, expect } from '@playwright/test';

/**
 * Smoke coverage for Service Desk routes once a portal is enabled on production.
 * The detailed create → assign → approve flow needs a seeded service project.
 */
test.describe('Service Desk', () => {
  test('portal route is reachable for authenticated users', async ({ page }) => {
    await page.goto('/portal');
    await expect(page).toHaveURL(/portal/);
    // Either the portal home or login redirect is acceptable depending on auth state.
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
