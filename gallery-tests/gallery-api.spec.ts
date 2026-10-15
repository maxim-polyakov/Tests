// @ts-nocheck -- imported into WrightTest; dependencies live in its backend image.
import { expect, test } from '@playwright/test';

test('API MisaGallery возвращает рисунки и фон', async ({ page }) => {
  await page.goto(process.env.API_IMAGES_URL ?? '');
  await expect(page.locator('body')).toContainText('images');
  await expect(page.locator('body')).toContainText('backgroundUrl');
  await expect(page.locator('body')).toContainText('storage.yandexcloud.net/misagallery');
});
