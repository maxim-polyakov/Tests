// @ts-nocheck -- imported into WrightTest; dependencies live in its backend image.
import { expect, test } from '@playwright/test';

test('боковое меню и новый чат работают', async ({ page }) => {
  await page.goto(process.env.LOGIN_URL ?? '');
  await page.locator('input').nth(0).fill(process.env.TEST_EMAIL ?? '');
  await page.locator('input').nth(1).fill(process.env.TEST_PASSWORD ?? '');
  await page.locator('button.btn-outline-success').click();
  await expect(page).toHaveURL(process.env.CHAT_URL ?? '');

  await page.locator('.new-chat-button').click();
  await expect(page.locator('.message-textarea')).toBeVisible();

  await page.locator('.menu-toggle-btn').click();
  await expect(page.locator('.chat-floating-menu-btn')).toBeVisible();
  await page.locator('.chat-floating-menu-btn').click();
  await expect(page.locator('.sidebar-content')).toBeVisible();
});
