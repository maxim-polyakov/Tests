// @ts-nocheck -- imported into WrightTest; dependencies live in its backend image.
import { expect, test } from '@playwright/test';

test('страница входа Canban доступна', async ({ page }) => {
  await page.goto(process.env.LOGIN_URL ?? '');

  await expect(page).toHaveTitle('Канбан — Квесты и уровни');
  await expect(page.locator('.auth-form')).toBeVisible();
  await expect(page.locator('.auth-form h1')).toHaveText('Вход');
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeVisible();
  await expect(page.locator('a[href="/register?lang=ru"]')).toBeVisible();
});

test('неверные данные не создают сессию Canban', async ({ page }) => {
  await page.goto(process.env.LOGIN_URL ?? '');
  await page.locator('input[type="email"]').fill('missing-canban-user@example.invalid');
  await page.locator('input[type="password"]').fill('wrong-password');
  await page.locator('button[type="submit"]').click();

  await expect(page.locator('.auth-error')).toBeVisible();
  await expect(page).toHaveURL(process.env.LOGIN_URL ?? '');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('token'))).toBeNull();
});

test('анонимный пользователь перенаправляется на вход', async ({ page }) => {
  await page.goto(process.env.HOME_URL ?? '');

  await expect(page).toHaveURL(process.env.LOGIN_URL ?? '');
  await expect(page.locator('.auth-form')).toBeVisible();
});
