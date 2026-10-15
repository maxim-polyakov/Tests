// @ts-nocheck -- imported into WrightTest; dependencies live in its backend image.
import { expect, test } from '@playwright/test';

test('API MisaGallery возвращает рисунки и фон', async ({ page }) => {
  const apiUrl = process.env.API_URL ?? '';
  await page.goto(`${apiUrl}/api/images`);
  const text = await page.locator('body').textContent();
  const body = JSON.parse(text ?? '{}');
  expect(Array.isArray(body.images)).toBeTruthy();
  expect(body.images.length).toBeGreaterThan(0);
  expect(body.backgroundUrl).toMatch(/^https:\/\//);

  const first = body.images[0];
  expect(first.id).toBeDefined();
  expect(first.url).toMatch(/^https:\/\//);
});
