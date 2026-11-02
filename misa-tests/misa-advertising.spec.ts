// @ts-nocheck -- imported into WrightTest; dependencies live in its backend image.
// Keep steps flat (no const/lets): WrightTest import drops assertions after const.
import { expect, test } from '@playwright/test';

test('Misa показывает рекламу для запроса о смартфоне', async ({ page }) => {
  test.setTimeout(120_000);

  await page.goto(process.env.LOGIN_URL ?? '');
  await page.locator('input').nth(0).fill(process.env.TEST_EMAIL ?? '');
  await page.locator('input').nth(1).fill(process.env.TEST_PASSWORD ?? '');
  await page.locator('button.btn-outline-success').click();
  await expect(page).toHaveURL(process.env.CHAT_URL ?? '');
  await expect(page.locator('.chat-container')).toBeVisible();

  await page.locator('.new-chat-button').click();
  await expect(page.locator('.message-textarea')).toBeVisible();
  // WrightTest captures a screenshot after the response becomes visible.
  await page.locator('.message-textarea').fill('Купить смартфон. Ок.');
  await page.getByTitle('Отправить сообщение').click();
  await expect(page.locator('.misa-message').first()).toBeVisible({ timeout: 90_000 });
});
