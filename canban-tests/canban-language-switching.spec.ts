// @ts-nocheck -- imported into WrightTest; dependencies live in its backend image.
import { expect, test } from '@playwright/test';

test('Canban сохраняет выбранный язык в URL', async ({ page }) => {
  await page.goto(process.env.LOGIN_URL ?? '');

  await expect(page.locator('.language-selector select')).toHaveValue('ru');
  await expect(page.locator('.language-selector select option')).toHaveCount(76);

  await page.locator('.language-selector select').selectOption('en');
  await expect(page).toHaveURL(process.env.LOGIN_EN_URL ?? '');
  await expect(page.locator('.auth-form h1')).toHaveText('Sign in');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');

  await page.reload();
  await expect(page.locator('.language-selector select')).toHaveValue('en');
  await expect(page.locator('.auth-form h1')).toHaveText('Sign in');
});

test('Canban включает RTL для арабского языка', async ({ page }) => {
  await page.goto(process.env.LOGIN_URL ?? '');
  await page.locator('.language-selector select').selectOption('ar');

  await expect(page).toHaveURL(/[?&]lang=ar(?:&|$)/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('.language-selector')).not.toContainText('🌐');
});
