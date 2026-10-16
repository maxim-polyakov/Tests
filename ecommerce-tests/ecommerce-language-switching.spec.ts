// @ts-nocheck -- imported into WrightTest; dependencies live in its backend image.
import { expect, test } from '@playwright/test';

test('язык входа хранится в URL', async ({ page }) => {
  await page.goto(process.env.LOGIN_URL ?? '');

  await expect(page.locator('.language-selector select')).toHaveValue('ru');
  await page.locator('.language-selector select').selectOption('en');

  await expect(page).toHaveURL(process.env.LOGIN_EN_URL ?? '');
  await expect(page.locator('.auth-title')).toHaveText('Sign in');
  await expect(page.locator('button.auth-btn')).toHaveText('Sign in');

  await page.reload();
  await expect(page.locator('.language-selector select')).toHaveValue('en');
  await expect(page.locator('.auth-title')).toHaveText('Sign in');
});
