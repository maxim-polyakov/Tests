import { expect, type Page, test } from '@playwright/test';

async function login(page: Page) {
  const email = process.env.MISA_TEST_EMAIL;
  const password = process.env.MISA_TEST_PASSWORD;
  if (!email || !password) throw new Error('Gallery test credentials are required');

  await page.goto('/login?lang=ru');
  await page.locator('input').nth(0).fill(email);
  await page.locator('input').nth(1).fill(password);
  await page.locator('button.btn-outline-success').click();
  await expect(page).toHaveURL(/\/gallery\?.*lang=ru/, { timeout: 30_000 });
}

test.describe('MisaGallery authenticated session', () => {
  test('gallery renders stored images and background', async ({ page }) => {
    await login(page);

    const images = page.locator('.gallery-item img');
    await expect(images.first()).toBeVisible();
    expect(await images.count()).toBeGreaterThan(0);
    await expect
      .poll(() => images.first().evaluate((image: HTMLImageElement) =>
        image.complete && image.naturalWidth > 0))
      .toBe(true);
    await expect(page.locator('.scroll-container')).toHaveCSS('background-image', /url\(.+\)/);
  });

  test('regular user cannot open admin uploads', async ({ page }) => {
    await login(page);
    await expect(page.locator('a[href^="/admin?"]')).toHaveCount(0);

    await page.goto('/admin?lang=ru');
    await expect(page.locator('.alert-danger')).toBeVisible();
    await expect(page.locator('input[type="file"]')).toHaveCount(0);
  });

  test('logout clears the authenticated session', async ({ page }) => {
    await login(page);
    await page.locator('a[href^="/login?"]').click();
    await expect(page).toHaveURL(/\/login\?.*lang=ru/);

    await page.goto('/gallery?lang=ru');
    await expect(page).toHaveURL(/\/login\?.*lang=ru/);
  });
});
