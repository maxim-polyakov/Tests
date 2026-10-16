// @ts-nocheck -- imported into WrightTest; dependencies live in its backend image.
import { expect, test } from '@playwright/test';

test('MisaGallery сохраняет выбранный язык в URL', async ({ page }) => {
  await page.goto(process.env.LOGIN_URL ?? '');
  const language = page.locator('.gallery-language-select');

  await expect(language).toHaveValue('ru');
  await language.selectOption('en');
  await expect(page).toHaveURL(/[?&]lang=en(?:&|$)/);
  await expect(page).toHaveURL(/[?&]v=2(?:&|$)/);
  await expect(page).toHaveTitle('Misa Gallery');
  await expect(page.locator('input').nth(0)).toHaveAttribute('placeholder', 'Enter email');

  await language.selectOption('de');
  await expect(page).toHaveURL(/[?&]lang=de(?:&|$)/);
  await expect(page.locator('input').nth(0)).toHaveAttribute('placeholder', 'E-Mail eingeben');

  await language.selectOption('ru');
  await expect(page).toHaveURL(/[?&]lang=ru(?:&|$)/);
  await expect(page).toHaveTitle('Галерея Misa');
  await expect(page.locator('input').nth(0)).toHaveAttribute('placeholder', 'Введите email');
});
