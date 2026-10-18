// @ts-nocheck -- imported into WrightTest; dependencies live in its backend image.
import { expect, test } from '@playwright/test';

test('businessCard сохраняет выбранный язык в URL', async ({ page }) => {
  await page.goto(process.env.HOME_URL ?? '');
  await expect(page).toHaveURL(process.env.HOME_URL ?? '');

  await page.goto(process.env.HOME_EN_URL ?? '');
  await expect(page).toHaveURL(process.env.HOME_EN_URL ?? '');
  await expect(page).toHaveTitle('Maxim Polyakov — Full Stack Developer | Portfolio');
  await expect(page.locator('.hero-title')).toContainText('IT solutions');

  await page.goto(process.env.HOME_DE_URL ?? '');
  await expect(page).toHaveURL(process.env.HOME_DE_URL ?? '');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');

  await page.goto(process.env.HOME_URL ?? '');
  await expect(page).toHaveURL(process.env.HOME_URL ?? '');
});
