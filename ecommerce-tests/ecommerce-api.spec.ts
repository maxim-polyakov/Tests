// @ts-nocheck -- imported into WrightTest; dependencies live in its backend image.
import { expect, test } from '@playwright/test';

test('публичное API e-commerce возвращает каталог', async ({ page }) => {
  await page.goto(process.env.API_PRODUCTS_URL ?? '');
  await expect(page.locator('body')).toContainText('content');
  await expect(page.locator('body')).toContainText('totalElements');
});
