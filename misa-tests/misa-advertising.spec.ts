// @ts-nocheck -- imported into WrightTest; dependencies live in its backend image.
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

  await page.locator('.message-textarea').fill('Посоветуй смартфон с хорошей камерой, который можно купить в этом году');
  await page.getByTitle('Отправить сообщение').click();
  await expect(page.locator('.user-message').last()).toContainText('смартфон');
  await expect(page.locator('.misa-message').nth(0)).toBeVisible();
  await expect(page.locator('.misa-message').nth(0).locator('.message-ad')).toBeVisible();
  await expect(page.locator('.misa-message').nth(0).locator('.message-ad-label')).toHaveText('Реклама');
  await expect(page.locator('.misa-message').nth(0).locator('.message-ad-body')).toBeVisible();
  await expect(page.locator('.misa-message').nth(0).locator('.message-ad-body a').first()).toBeVisible();
  await page.locator('.misa-message').nth(0).locator('.message-ad-body a').first().click();
});
