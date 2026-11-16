// @ts-nocheck -- imported into WrightTest; dependencies live in its backend image.
import { expect, test } from '@playwright/test';

// Keep this short: switching every locale in one run (~90 steps) races page
// reloads inside WrightTest and can hang a selectOption forever, blocking the queue.
test('интерфейс Misa переключается между языками', async ({ page }) => {
  await page.goto(process.env.LOGIN_URL ?? '');
  await page.locator('input').nth(0).fill(process.env.TEST_EMAIL ?? '');
  await page.locator('input').nth(1).fill(process.env.TEST_PASSWORD ?? '');
  await page.locator('button.btn-outline-success').click();
  await expect(page).toHaveURL(process.env.CHAT_URL ?? '');

  await page.locator('.sidebar-profile-trigger').click();
  await page.locator('.sidebar-profile-item').nth(0).click();
  await expect(page.locator('.settings-modal-title')).toHaveText('Настройки');

  await page.locator('.settings-modal-nav-item').nth(0).click();
  await expect(page.locator('.settings-language-select')).toBeVisible();

  await page.locator('.settings-language-select').selectOption('en');
  await expect(page).toHaveURL(process.env.CHAT_EN_URL ?? '');
  await expect(page.locator('.settings-modal-title')).toHaveText('Settings');

  await page.locator('.settings-language-select').selectOption('de');
  await expect(page).toHaveURL(process.env.CHAT_DE_URL ?? '');

  await page.locator('.settings-language-select').selectOption('ar');
  await expect(page).toHaveURL(process.env.CHAT_AR_URL ?? '');
  await expect(page.locator('.settings-modal-title')).toHaveText('الإعدادات');

  await page.locator('.settings-language-select').selectOption('ru');
  await expect(page).toHaveURL(process.env.CHAT_URL ?? '');
  await expect(page.locator('.settings-modal-title')).toHaveText('Настройки');
  await expect(page.locator('.new-chat-text')).toHaveText('Новый чат');
});
