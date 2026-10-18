// @ts-nocheck -- imported into WrightTest; dependencies live in its backend image.
import { expect, test } from '@playwright/test';

test('динамическое превью Canban локализовано', async ({ page }) => {
  await page.goto(process.env.HOME_EN_URL ?? '');

  await expect(page).toHaveTitle('Kanban — Quests and levels');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    'Kanban — Quests and levels',
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    'content',
    'summary_large_image',
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    'https://canban.baxic.ru/canban-preview.png',
  );
  await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1024');
});

test('большая картинка превью Canban доступна', async ({ page }) => {
  await page.goto(process.env.PREVIEW_IMAGE_URL ?? '');

  await expect(page.locator('img')).toBeVisible();
  const size = await page.locator('img').evaluate((image: HTMLImageElement) => ({
    width: image.naturalWidth,
    height: image.naturalHeight,
  }));
  expect(size).toEqual({ width: 1024, height: 1024 });
});
