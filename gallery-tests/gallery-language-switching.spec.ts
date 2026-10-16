// @ts-nocheck -- imported into WrightTest; dependencies live in its backend image.
import { expect, test } from '@playwright/test';

test('MisaGallery сохраняет выбранный язык в URL', async ({ page }) => {
  await page.goto(process.env.LOGIN_URL ?? '');
  await expect(page.locator('.gallery-language-select')).toHaveValue('ru');
  await page.locator('.gallery-language-select').selectOption('en');
  await expect(page).toHaveURL(process.env.LOGIN_EN_URL ?? '');
  await expect(page).toHaveTitle('Misa Gallery');
  await expect(page.locator('input').nth(0)).toHaveAttribute('placeholder', 'Enter email');

  await page.locator('.gallery-language-select').selectOption('de');
  await expect(page).toHaveURL(process.env.LOGIN_DE_URL ?? '');
  await expect(page.locator('input').nth(0)).toHaveAttribute('placeholder', 'E-Mail eingeben');

  await page.locator('.gallery-language-select').selectOption('ru');
  await expect(page).toHaveURL(process.env.LOGIN_URL ?? '');
  await expect(page).toHaveTitle('Галерея Misa');
  await expect(page.locator('input').nth(0)).toHaveAttribute('placeholder', 'Введите email');
});
