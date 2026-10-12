// @ts-nocheck -- imported into WrightTest; dependencies live in its backend image.
import { expect, test } from '@playwright/test';

test('публичные страницы Misa открываются', async ({ page }) => {
  await page.goto(process.env.LOGIN_URL ?? '');
  await expect(page).toHaveTitle('Misa AI Chat');
  await expect(page.locator('form')).toBeVisible();

  await page.goto(process.env.REGISTRATION_URL ?? '');
  await expect(page.locator('form')).toBeVisible();

  await page.goto(process.env.FORGOT_PASSWORD_URL ?? '');
  await expect(page.locator('form')).toBeVisible();
});
