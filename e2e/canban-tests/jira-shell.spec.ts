import { expect, test } from '@playwright/test';

test.describe('Canban Jira-like shell', () => {
  test('public login stays usable on a narrow mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/login?lang=ru');

    await expect(page.locator('.auth-form h1')).toHaveText('Вход');
    await expect(page.locator('.language-selector select')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    const languageBox = await page.locator('.language-selector').boundingBox();
    const submitBox = await page.locator('button[type="submit"]').boundingBox();
    expect(languageBox).toBeTruthy();
    expect(submitBox).toBeTruthy();
    expect(languageBox!.y + languageBox!.height).toBeLessThan(submitBox!.y);
  });

  test('anonymous home redirects to login without breaking language', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto('/?lang=en');

    await expect(page).toHaveURL(/\/login\?.*lang=en/);
    await expect(page.locator('.auth-form h1')).toHaveText('Sign in');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});
