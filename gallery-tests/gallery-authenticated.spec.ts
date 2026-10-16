// @ts-nocheck -- imported into WrightTest; dependencies live in its backend image.
import { expect, test } from '@playwright/test';

async function login(page) {
  await page.goto(process.env.LOGIN_URL ?? '');
  await page.locator('input').nth(0).fill(process.env.TEST_EMAIL ?? '');
  await page.locator('input').nth(1).fill(process.env.TEST_PASSWORD ?? '');
  await page.locator('button.btn-outline-success').click();
  await expect(page).toHaveURL(/\/gallery\?.*lang=ru.*v=2/);
}

test('авторизованный пользователь видит рисунки MisaGallery', async ({ page }) => {
  await login(page);

  const images = page.locator('.gallery .gallery-item img');
  await expect(images.first()).toBeVisible();
  expect(await images.count()).toBeGreaterThan(0);

  const firstImage = images.first();
  await expect
    .poll(() => firstImage.evaluate((image) => image.complete && image.naturalWidth > 0))
    .toBe(true);
  await expect(page.locator('.scroll-container')).toHaveCSS('background-image', /url\(.+\)/);
});
