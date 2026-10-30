// @ts-nocheck -- imported into WrightTest; dependencies live in its backend image.
import { expect, test } from '@playwright/test';

test('Misa показывает рекламу для запросов на разные темы', async ({ page }) => {
  test.setTimeout(360_000);

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
  await page.waitForTimeout(20_000);
  await expect(page.locator('.user-message').last()).toContainText('смартфон');
  await expect(page.locator('.misa-message').nth(0)).toBeVisible();
  await expect(page.locator('.misa-message').nth(0).locator('.message-ad')).toBeVisible();
  await expect(page.locator('.misa-message').nth(0).locator('.message-ad-label')).toHaveText('Реклама');
  await expect(page.locator('.misa-message').nth(0).locator('.message-ad-body')).toBeVisible();

  await page.locator('.message-textarea').fill('Подбери отель для отдыха у моря и расскажи, на что обратить внимание');
  await page.getByTitle('Отправить сообщение').click();
  await page.waitForTimeout(20_000);
  await expect(page.locator('.user-message').last()).toContainText('отель');
  await expect(page.locator('.misa-message').nth(1)).toBeVisible();
  await expect(page.locator('.misa-message').nth(1).locator('.message-ad')).toBeVisible();
  await expect(page.locator('.misa-message').nth(1).locator('.message-ad-label')).toHaveText('Реклама');
  await expect(page.locator('.misa-message').nth(1).locator('.message-ad-body')).toBeVisible();

  await page.locator('.message-textarea').fill('Помоги выбрать онлайн-курс по программированию для начинающего');
  await page.getByTitle('Отправить сообщение').click();
  await page.waitForTimeout(20_000);
  await expect(page.locator('.user-message').last()).toContainText('онлайн-курс');
  await expect(page.locator('.misa-message').nth(2)).toBeVisible();
  await expect(page.locator('.misa-message').nth(2).locator('.message-ad')).toBeVisible();
  await expect(page.locator('.misa-message').nth(2).locator('.message-ad-label')).toHaveText('Реклама');
  await expect(page.locator('.misa-message').nth(2).locator('.message-ad-body')).toBeVisible();
});
