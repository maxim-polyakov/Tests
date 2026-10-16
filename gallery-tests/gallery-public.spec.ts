// @ts-nocheck -- imported into WrightTest; dependencies live in its backend image.
import { expect, test } from '@playwright/test';

test('публичные страницы MisaGallery открываются', async ({ page }) => {
  await page.goto(process.env.LOGIN_URL ?? '');
  await expect(page).toHaveTitle('Галерея Misa');
  await expect(page).toHaveURL(/[?&]lang=ru(?:&|$)/);
  await expect(page.locator('form')).toBeVisible();
  await expect(page.locator('input')).toHaveCount(2);

  await page.goto(process.env.REGISTRATION_URL ?? '');
  await expect(page.locator('form')).toBeVisible();

  await page.goto(process.env.GALLERY_URL ?? '');
  await expect(page).toHaveURL(/\/login\?.*lang=ru/);
});
