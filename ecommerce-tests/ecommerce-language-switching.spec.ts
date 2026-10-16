// @ts-nocheck -- imported into WrightTest; dependencies live in its backend image.
import { expect, test } from '@playwright/test';

test('язык входа хранится в URL', async ({ page }) => {
  await page.goto(process.env.LOGIN_URL ?? '');

  const language = page.locator('.language-selector select');
  await expect(language).toHaveValue('ru');
  await language.selectOption('en');

  await expect(page).toHaveURL(process.env.LOGIN_EN_URL ?? '');
  await expect(page.locator('.auth-title')).toHaveText('Sign in');
  await expect(page.locator('button.auth-btn')).toHaveText('Sign in');

  await page.reload();
  await expect(language).toHaveValue('en');
  await expect(page.locator('.auth-title')).toHaveText('Sign in');
});
