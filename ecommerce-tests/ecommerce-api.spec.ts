// @ts-nocheck -- imported into WrightTest; dependencies live in its backend image.
import { expect, test } from '@playwright/test';

test('публичное API e-commerce возвращает каталог', async ({ page }) => {
  await page.goto(`${process.env.API_URL}/product?page=0&size=10`);
  await expect(page.locator('body')).toContainText('"content"');
  await expect(page.locator('body')).toContainText('"totalElements"');
});

test('публичное превью локализуется через lang', async ({ page }) => {
  await page.goto(`${process.env.API_URL}/og/preview?lang=en`);
  await expect(page.locator('body')).toContainText('Online Store');
});
