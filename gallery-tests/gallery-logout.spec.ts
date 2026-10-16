// @ts-nocheck -- imported into WrightTest; dependencies live in its backend image.
import { expect, test } from '@playwright/test';

test('пользователь выходит из MisaGallery', async ({ page }) => {
  await page.goto(process.env.LOGIN_URL ?? '');
  await page.locator('input').nth(0).fill(process.env.TEST_EMAIL ?? '');
  await page.locator('input').nth(1).fill(process.env.TEST_PASSWORD ?? '');
  await page.locator('button.btn-outline-success').click();
  await expect(page).toHaveURL(process.env.GALLERY_URL ?? '');

  await page.locator('a[href^="/login?"]').click();
  await expect(page).toHaveURL(process.env.LOGIN_URL ?? '');
  await expect(page.locator('form')).toBeVisible();
});
