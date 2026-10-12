import { expect, type Page, test } from '@playwright/test';

async function login(page: Page) {
  const email = process.env.MISA_TEST_EMAIL;
  const password = process.env.MISA_TEST_PASSWORD;
  if (!email || !password) throw new Error('Misa test credentials are required');

  await page.goto('/login?lang=ru');
  await page.locator('input').nth(0).fill(email);
  await page.locator('input').nth(1).fill(password);
  await page.locator('button.btn-outline-success').click();
  await expect(page).toHaveURL(/\/chat\?lang=ru$/);
  await expect(page.locator('.chat-container')).toBeVisible();
}

test('complete chat lifecycle and message actions', async ({ page }) => {
  await login(page);

  const marker = Date.now();
  const prompt = `E2E smoke check ${marker}: reply with OK`;
  const renamedTitle = `E2E ${marker}`;

  await page.locator('.new-chat-button').click();
  const textarea = page.locator('.message-textarea');
  await expect(textarea).toBeVisible();
  await textarea.fill(prompt);
  await page.getByTitle('Отправить сообщение').click();

  await expect(page.locator('.user-message').filter({ hasText: prompt })).toBeVisible();
  const answer = page.locator('.misa-message').last();
  await expect(answer).toBeVisible({ timeout: 75_000 });

  await answer.getByTitle('Копировать').click();
  await answer.getByTitle('Перегенерировать').click();
  await expect(page.locator('.typing-indicator')).toBeHidden({ timeout: 75_000 });
  await answer.getByTitle('Нравится', { exact: true }).click();
  await answer.getByTitle('Не нравится', { exact: true }).click();
  await expect(page.locator('.feedback-modal')).toBeVisible();
  await page.getByRole('button', { name: 'Вредно / Небезопасно' }).click();
  await page.locator('.feedback-modal-textarea').fill('Automated E2E feedback');
  await page.locator('.feedback-modal').getByRole('button', { name: 'Отправить' }).click();
  await expect(page.locator('.feedback-modal')).toBeHidden();

  await answer.getByTitle('Поделиться').click();
  await expect(page.locator('.share-bar')).toBeVisible();
  await page.getByRole('button', { name: /Создать публичную ссылку/ }).click();
  await expect(page.locator('.share-toast')).toBeVisible();
  await page.locator('.share-bar').getByRole('button', { name: 'Отмена' }).click();

  const activeChat = page.locator('.sidebar-chat-item-wrap.active');
  await expect(activeChat).toBeVisible();
  await activeChat.locator('.sidebar-chat-menu-btn').click();
  await activeChat.locator('.sidebar-chat-menu-item').nth(0).click();
  const renameInput = activeChat.locator('.sidebar-chat-rename-input');
  await renameInput.fill(renamedTitle);
  await renameInput.press('Enter');
  await expect(activeChat.locator('.sidebar-chat-title')).toHaveText(renamedTitle);

  await activeChat.locator('.sidebar-chat-menu-btn').click();
  await activeChat.locator('.sidebar-chat-menu-item').nth(1).click();

  await activeChat.locator('.sidebar-chat-menu-btn').click();
  await activeChat.locator('.sidebar-chat-menu-item').nth(2).click();
  await expect(page.locator('.share-bar')).toBeVisible();
  await page.locator('.share-bar').getByRole('button', { name: 'Выбрать все' }).click();
  await page.locator('.share-bar').getByRole('button', { name: 'Отмена' }).click();

  await activeChat.locator('.sidebar-chat-menu-btn').click();
  page.once('dialog', (dialog) => dialog.accept());
  await activeChat.locator('.sidebar-chat-menu-item').nth(3).click();
  await expect(page.locator('.sidebar-chat-title', { hasText: renamedTitle })).toHaveCount(0);
});
