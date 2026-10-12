import { expect, type Page, test } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

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

async function openSettings(page: Page) {
  await page.locator('.sidebar-profile-trigger').click();
  await expect(page.locator('.sidebar-profile-panel')).toBeVisible();
  await page.locator('.sidebar-profile-item').first().click();
  await expect(page.locator('.settings-modal')).toBeVisible();
}

test('profile menu and every safe settings control', async ({ page }) => {
  await login(page);

  await page.locator('.sidebar-profile-trigger').click();
  await page.getByRole('button', { name: /Помощь и отзыв/ }).click();
  await expect(page.locator('.sidebar-profile-panel')).toBeHidden();

  await openSettings(page);

  await page.locator('.settings-modal-nav-item').nth(0).click();
  await expect(page.locator('.settings-general-section')).toBeVisible();
  await page.getByRole('button', { name: 'Светлая' }).click();
  await page.getByRole('button', { name: 'Тёмная' }).click();
  await page.getByRole('button', { name: 'Системная' }).click();
  await page.locator('.settings-language-select').selectOption('en');
  await expect(page.locator('.settings-modal-title')).toHaveText('Settings');
  await page.locator('.settings-language-select').selectOption('ru');
  await expect(page.locator('.settings-modal-title')).toHaveText('Настройки');

  await page.locator('.settings-modal-nav-item').nth(1).click();
  await expect(page.locator('.settings-profile-section')).toBeVisible();
  await page.getByRole('button', { name: 'Удалить' }).click();
  await expect(page.locator('.settings-confirm-modal')).toBeVisible();
  await page.getByRole('button', { name: 'Отмена' }).click();
  await expect(page.locator('.settings-confirm-modal')).toBeHidden();

  await page.locator('.settings-modal-nav-item').nth(2).click();
  await expect(page.locator('.settings-data-section')).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Экспортировать' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^misa_data-\d{4}-\d{2}-\d{2}\.zip$/);

  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'Удалить всё' }).click();

  await page.locator('.settings-modal-nav-item').nth(3).click();
  await expect(page.getByText('Misa AI Чат')).toBeVisible();
  await page.getByRole('button', { name: 'Закрыть' }).click();
  await expect(page.locator('.settings-modal')).toBeHidden();
});

test('normal logout button', async ({ page }) => {
  await login(page);
  await page.locator('.sidebar-profile-trigger').click();
  await page.locator('.sidebar-profile-item-logout').click();
  await expect(page).toHaveURL(/\/login/);
});

test('logout from all devices button', async ({ page }) => {
  await login(page);
  await openSettings(page);
  await page.locator('.settings-modal-nav-item').nth(1).click();
  await page.locator('.settings-btn-logout').click();
  await expect(page).toHaveURL(/\/login/);
});
