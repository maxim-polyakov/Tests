// @ts-nocheck -- imported into WrightTest; dependencies live in its backend image.
import { expect, test } from '@playwright/test';

async function login(page) {
  await page.goto(process.env.LOGIN_URL ?? '');
  await page.locator('input').nth(0).fill(process.env.TEST_EMAIL ?? '');
  await page.locator('input').nth(1).fill(process.env.TEST_PASSWORD ?? '');
  await page.locator('button.btn-outline-success').click();
  await expect(page).toHaveURL(process.env.GALLERY_URL ?? '');
}

test('панель администратора MisaGallery защищена от обычного пользователя', async ({ page }) => {
  await login(page);

  await expect(page.locator('a[href="/admin"]')).toHaveCount(0);
  await page.goto(process.env.ADMIN_URL ?? '');
  await expect(page).toHaveURL(process.env.ADMIN_URL ?? '');

  await expect(page.locator('.alert-danger')).toBeVisible();
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await expect(page.locator('a[href="/gallery"]')).toBeVisible();
});
