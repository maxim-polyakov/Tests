import { expect, test } from '@playwright/test';

test.describe('E-commerce public authentication', () => {
  test('login page and language URL are available', async ({ page }) => {
    await page.goto('/auth/login?lang=ru');

    await expect(page.locator('.auth-card')).toBeVisible();
    await expect(page.locator('.auth-title')).toHaveText('Авторизация');
    await expect(page.locator('button.auth-btn')).toBeDisabled();

    const language = page.locator('.language-selector select');
    await expect(language).toHaveValue('ru');
    await language.selectOption('en');
    await expect(page).toHaveURL(/\/auth\/login\?.*lang=en/);
    await expect(page.locator('.auth-title')).toHaveText('Sign in');
  });

  test('invalid credentials stay unauthenticated', async ({ page }) => {
    await page.goto('/auth/login?lang=ru');
    await page.locator('input').nth(0).fill('missing-e2e-user@example.invalid');
    await page.locator('input[type="password"]').fill('wrong-password');
    await page.locator('button.auth-btn').click();

    await expect(page.locator('.auth-alert')).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/login\?.*lang=ru/);
    await expect.poll(() => page.evaluate(() => localStorage.getItem('token'))).toBeNull();
  });
});
