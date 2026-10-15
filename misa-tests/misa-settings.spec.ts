// @ts-nocheck -- imported into WrightTest; dependencies live in its backend image.
import { expect, test } from '@playwright/test';

test('вкладки настроек Misa открываются', async ({ page }) => {
  await page.goto(process.env.LOGIN_URL ?? '');
  await page.locator('input').nth(0).fill(process.env.TEST_EMAIL ?? '');
  await page.locator('input').nth(1).fill(process.env.TEST_PASSWORD ?? '');
  await page.locator('button.btn-outline-success').click();
  await expect(page).toHaveURL(process.env.CHAT_URL ?? '');

  await page.locator('.sidebar-profile-trigger').click();
  await page.locator('.sidebar-profile-item').nth(0).click();
  await expect(page.locator('.settings-modal')).toBeVisible();

  await page.locator('.settings-modal-nav-item').nth(0).click();
  await expect(page.locator('.settings-general-section')).toBeVisible();
  await page.locator('.settings-theme-btn').nth(1).click();

  await page.locator('.settings-modal-nav-item').nth(1).click();
  await expect(page.locator('.settings-profile-section')).toBeVisible();

  await page.locator('.settings-modal-nav-item').nth(2).click();
  await expect(page.locator('.settings-data-section')).toBeVisible();

  await page.locator('.settings-modal-nav-item').nth(3).click();
  await expect(page.locator('.settings-placeholder')).toBeVisible();

  await page.locator('.settings-modal-close').click();
  await expect(page.locator('.chat-container')).toBeVisible();
});
