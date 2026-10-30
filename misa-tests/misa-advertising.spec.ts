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
  await expect(page.locator('.reconnect-container')).toHaveCount(0, { timeout: 30_000 });

  await page.locator('.new-chat-button').click();
  const textarea = page.locator('.message-textarea');
  const sendButton = page.getByTitle('Отправить сообщение');
  const assistantMessages = page.locator('.misa-message');
  await expect(textarea).toBeVisible();
  await expect(textarea).toBeEnabled({ timeout: 30_000 });

  const answersBeforeSmartphone = await assistantMessages.count();
  await textarea.fill('Посоветуй смартфон с хорошей камерой, который можно купить в этом году');
  await sendButton.click();
  await expect(page.locator('.user-message').last()).toContainText('смартфон');
  await expect(assistantMessages).toHaveCount(answersBeforeSmartphone + 1, { timeout: 90_000 });
  const smartphoneAnswer = assistantMessages.nth(answersBeforeSmartphone);
  await expect(smartphoneAnswer.locator('.message-ad')).toBeVisible({
    timeout: 90_000,
  });
  await expect(smartphoneAnswer.locator('.message-ad-label')).toHaveText('Реклама');
  await expect(smartphoneAnswer.locator('.message-ad-body')).not.toBeEmpty();

  const answersBeforeHotel = await assistantMessages.count();
  await textarea.fill('Подбери отель для отдыха у моря и расскажи, на что обратить внимание');
  await sendButton.click();
  await expect(page.locator('.user-message').last()).toContainText('отель');
  await expect(assistantMessages).toHaveCount(answersBeforeHotel + 1, { timeout: 90_000 });
  const hotelAnswer = assistantMessages.nth(answersBeforeHotel);
  await expect(hotelAnswer.locator('.message-ad')).toBeVisible({
    timeout: 90_000,
  });
  await expect(hotelAnswer.locator('.message-ad-label')).toHaveText('Реклама');
  await expect(hotelAnswer.locator('.message-ad-body')).not.toBeEmpty();

  const answersBeforeCourse = await assistantMessages.count();
  await textarea.fill('Помоги выбрать онлайн-курс по программированию для начинающего');
  await sendButton.click();
  await expect(page.locator('.user-message').last()).toContainText('онлайн-курс');
  await expect(assistantMessages).toHaveCount(answersBeforeCourse + 1, { timeout: 90_000 });
  const courseAnswer = assistantMessages.nth(answersBeforeCourse);
  await expect(courseAnswer.locator('.message-ad')).toBeVisible({
    timeout: 90_000,
  });
  await expect(courseAnswer.locator('.message-ad-label')).toHaveText('Реклама');
  await expect(courseAnswer.locator('.message-ad-body')).not.toBeEmpty();
});
