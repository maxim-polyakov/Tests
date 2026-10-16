// @ts-nocheck -- imported into WrightTest; dependencies live in its backend image.
import { expect, test } from '@playwright/test';

test('пользователь выходит из MisaGallery', async ({ page }) => {
  await page.goto(process.env.LOGIN_URL ?? '');
  await page.locator('input').nth(0).fill(process.env.TEST_EMAIL ?? '');
  await page.locator('input').nth(1).fill(process.env.TEST_PASSWORD ?? '');
  await page.locator('button.btn-outline-success').click();
  await expect(page).toHaveURL(/\/gallery\?.*lang=ru.*v=2/);

  await page.locator('a[href^="/login?"]').click();
  await expect(page).toHaveURL(/\/login\?.*lang=ru.*v=2/);
  await expect(page.locator('form')).toBeVisible();
});
