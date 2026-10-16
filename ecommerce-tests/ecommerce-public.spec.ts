// @ts-nocheck -- imported into WrightTest; dependencies live in its backend image.
import { expect, test } from '@playwright/test';

test('страница входа e-commerce доступна', async ({ page }) => {
  await page.goto(process.env.LOGIN_URL ?? '');

  await expect(page.locator('.auth-card')).toBeVisible();
  await expect(page.locator('.auth-title')).toBeVisible();
  await expect(page.locator('input').nth(0)).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();
  await expect(page.locator('button.auth-btn')).toBeDisabled();
  await expect(page.locator('a.auth-switch-link')).toHaveAttribute(
    'href',
    /\/auth\/registration\?.*lang=ru/,
  );
});

test('неверные данные не создают сессию', async ({ page }) => {
  await page.goto(process.env.LOGIN_URL ?? '');
  await page.locator('input').nth(0).fill('missing-e2e-user@example.invalid');
  await page.locator('input[type="password"]').fill('wrong-password');
  await page.locator('button.auth-btn').click();

  await expect(page.locator('.auth-alert')).toBeVisible();
  await expect(page).toHaveURL(/\/auth\/login\?.*lang=ru/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('token'))).toBeNull();
});
