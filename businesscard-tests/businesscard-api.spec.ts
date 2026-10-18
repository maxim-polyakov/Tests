// @ts-nocheck -- imported into WrightTest; dependencies live in its backend image.
import { expect, test } from '@playwright/test';

test('API businessCard отвечает на health check', async ({ page }) => {
  await page.goto(process.env.API_HEALTH_URL ?? '');
  await expect(page.locator('body')).toContainText('status');
  await expect(page.locator('body')).toContainText('ok');
});

test('картинка превью businessCard доступна', async ({ page }) => {
  await page.goto(process.env.PREVIEW_IMAGE_URL ?? '');
  await expect(page.locator('img')).toBeVisible();
});
