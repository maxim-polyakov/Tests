// @ts-nocheck -- imported into WrightTest; dependencies live in its backend image.
import { expect, test } from '@playwright/test';

async function login(page) {
  await page.goto(process.env.LOGIN_URL ?? '');
  await page.locator('input').nth(0).fill(process.env.TEST_EMAIL ?? '');
  await page.locator('input[type="password"]').fill(process.env.TEST_PASSWORD ?? '');
  await page.locator('button.auth-btn').click();
  await expect(page).toHaveURL(process.env.SHOP_URL ?? '', { timeout: 30_000 });
}

test('пользователь входит и открывает разделы магазина', async ({ page }) => {
  await login(page);

  await expect(page.locator('.ecommerce-header')).toBeVisible();
  await expect(page.locator('.navigation .nav-btn')).toHaveCount(5);
  await expect(page.locator('.ecommerce-main')).toBeVisible();

  await page.getByRole('button', { name: /Все продукты/ }).click();
  await expect(page.locator('.ecommerce-main')).toBeVisible();

  await page.getByRole('button', { name: /История покупок/ }).click();
  await expect(page.locator('.ecommerce-main')).toBeVisible();

  await page.getByRole('button', { name: /Профиль/ }).click();
  await expect(page.locator('.logout-btn')).toBeVisible();
});

test('выход удаляет локальную сессию', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: /Профиль/ }).click();
  await page.locator('.logout-btn').click();

  await expect(page).toHaveURL(process.env.LOGIN_URL ?? '');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('token'))).toBeNull();
});
