// @ts-nocheck -- imported into WrightTest; dependencies live in its backend image.
import { expect, test } from '@playwright/test';

test('Misa показывает рекламу для запроса об отеле', async ({ page }) => {
  test.setTimeout(120_000);

  await page.goto(process.env.LOGIN_URL ?? '');
  await page.locator('input').nth(0).fill(process.env.TEST_EMAIL ?? '');
  await page.locator('input').nth(1).fill(process.env.TEST_PASSWORD ?? '');
  await page.locator('button.btn-outline-success').click();
  await expect(page).toHaveURL(process.env.CHAT_URL ?? '');
  await expect(page.locator('.chat-container')).toBeVisible();

  await page.locator('.new-chat-button').click();
  await expect(page.locator('.message-textarea')).toBeVisible();
  await page.locator('.message-textarea').fill('Подбери отель для отдыха у моря. Ответь одним словом.');
  await page.getByTitle('Отправить сообщение').click();
  await expect(page.locator('.user-message').last()).toContainText('отель');
  const response = page.locator('.misa-message').nth(0);
  await expect(response).toBeVisible();
  const ads = response.locator('.message-ad');
  await expect(ads.first()).toBeVisible();
  expect(await ads.count()).toBeLessThanOrEqual(10);
  await expect(ads.first().locator('.message-ad-label')).toHaveText('Реклама');
  await expect(ads.first().locator('.message-ad-body')).toBeVisible();
  await expect(ads.first().locator('.message-ad-body a').first()).toBeVisible();
});
