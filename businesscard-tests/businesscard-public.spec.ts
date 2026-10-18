// @ts-nocheck -- imported into WrightTest; dependencies live in its backend image.
import { expect, test } from '@playwright/test';

test('публичная страница businessCard доступна', async ({ page }) => {
  await page.goto(process.env.HOME_URL ?? '');

  await expect(page).toHaveTitle('Поляков Максим — Fullstack-разработчик | Портфолио');
  await expect(page.locator('.topbar')).toBeVisible();
  await expect(page.locator('.hero-title')).toBeVisible();
  await expect(page.locator('.profile-panel')).toBeVisible();
  await expect(page.locator('#services')).toBeVisible();
  await expect(page.locator('#projects')).toBeVisible();
  await expect(page.locator('#contacts form')).toBeVisible();
});

test('контактная форма содержит обязательные поля', async ({ page }) => {
  await page.goto(process.env.HOME_URL ?? '');

  await expect(page.locator('input[name="name"]')).toBeVisible();
  await expect(page.locator('input[name="email"]')).toBeVisible();
  await expect(page.locator('textarea[name="message"]')).toBeVisible();
  await expect(page.locator('input[name="consent"]')).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeVisible();
});
