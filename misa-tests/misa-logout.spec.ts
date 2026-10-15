// @ts-nocheck -- imported into WrightTest; dependencies live in its backend image.
import { expect, test } from '@playwright/test';

test('пользователь выходит из Misa', async ({ page }) => {
  await page.goto(process.env.LOGIN_URL ?? '');
  await page.locator('input').nth(0).fill(process.env.TEST_EMAIL ?? '');
  await page.locator('input').nth(1).fill(process.env.TEST_PASSWORD ?? '');
  await page.locator('button.btn-outline-success').click();
  await expect(page).toHaveURL(process.env.CHAT_URL ?? '');

  await page.locator('.sidebar-profile-trigger').click();
  await page.locator('.sidebar-profile-item-logout').click();
  await expect(page).toHaveURL(process.env.LOGOUT_URL ?? '');
  await expect(page.locator('form')).toBeVisible();
});
