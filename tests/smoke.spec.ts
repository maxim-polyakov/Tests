// @ts-nocheck -- imported into WrightTest; dependencies live in its backend image.
import { expect, test } from '@playwright/test';

test('главная страница открывается', async ({ page }) => {
  await page.goto(process.env.BASE_URL ?? '');
  await expect(page.locator('body')).toBeVisible();
});
