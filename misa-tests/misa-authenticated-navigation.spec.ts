// @ts-nocheck -- imported into WrightTest; dependencies live in its backend image.
import { expect, test } from '@playwright/test';

test('пользователь входит и открывает настройки Misa', async ({ page }) => {
  await page.goto(process.env.LOGIN_URL ?? '');
  await page.locator('input').nth(0).fill(process.env.TEST_EMAIL ?? '');
  await page.locator('input').nth(1).fill(process.env.TEST_PASSWORD ?? '');
  await page.locator('button.btn-outline-success').click();

  await expect(page).toHaveURL(process.env.CHAT_URL ?? '');
  await expect(page.locator('.chat-container')).toBeVisible();
  await expect(page.locator('.sidebar-new-chat')).toBeVisible();

  await page.locator('.sidebar-profile-trigger').click();
  await expect(page.locator('.sidebar-profile-panel')).toBeVisible();
  await page.locator('.sidebar-profile-item').nth(0).click();
  await expect(page.locator('.settings-modal')).toBeVisible();
  await expect(page.locator('.settings-modal-nav')).toBeVisible();
});
