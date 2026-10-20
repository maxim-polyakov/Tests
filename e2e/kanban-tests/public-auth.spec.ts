import { expect, test } from '@playwright/test';

test.describe('Kanban public authentication', () => {
  test('login, registration and password reset links preserve language', async ({ page }) => {
    await page.goto('/login?lang=ru');

    await expect(page).toHaveTitle('Канбан — Квесты и уровни');
    await expect(page.locator('.auth-form h1')).toHaveText('Вход');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    await page.locator('a[href="/register?lang=ru"]').click();
    await expect(page).toHaveURL(/\/register\?.*lang=ru/);
    await expect(page.locator('.auth-form h1')).toHaveText('Регистрация');

    await page.goto('/login?lang=ru');
    await page.locator('a[href="/forgot-password?lang=ru"]').click();
    await expect(page).toHaveURL(/\/forgot-password\?.*lang=ru/);
    await expect(page.locator('.auth-form h1')).toHaveText('Восстановление пароля');
  });

  test('invalid credentials stay unauthenticated', async ({ page }) => {
    await page.goto('/login?lang=ru');
    await page.locator('input[type="email"]').fill('missing-kanban-user@example.invalid');
    await page.locator('input[type="password"]').fill('wrong-password');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('.auth-error')).toBeVisible();
    await expect(page).toHaveURL(/\/login\?.*lang=ru/);
    await expect.poll(() => page.evaluate(() => localStorage.getItem('token'))).toBeNull();
  });

  test('anonymous protected route redirects to localized login', async ({ page }) => {
    await page.goto('/?lang=de');

    await expect(page).toHaveURL(/\/login\?.*lang=de/);
    await expect(page.locator('.auth-form')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  });
});
