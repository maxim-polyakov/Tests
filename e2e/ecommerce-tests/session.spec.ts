import { expect, type Page, test } from '@playwright/test';

async function login(page: Page) {
  const email = process.env.ECOMMERCE_TEST_EMAIL;
  const password = process.env.ECOMMERCE_TEST_PASSWORD;
  if (!email || !password) throw new Error('E-commerce test credentials are required');

  await page.goto('/auth/login?lang=ru');
  await page.locator('input').nth(0).fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button.auth-btn').click();
  await expect(page).toHaveURL(/\/shop\?.*lang=ru/, { timeout: 30_000 });
}

test.describe('E-commerce authenticated session', () => {
  test('shop navigation and profile render', async ({ page }) => {
    await login(page);

    await expect(page.locator('.ecommerce-header')).toBeVisible();
    await expect(page.locator('.navigation .nav-btn')).toHaveCount(5);

    await page.getByRole('button', { name: /Все продукты/ }).click();
    await expect(page.locator('.ecommerce-main')).toBeVisible();

    await page.getByRole('button', { name: /История покупок/ }).click();
    await expect(page.locator('.ecommerce-main')).toBeVisible();

    await page.getByRole('button', { name: /Профиль/ }).click();
    await expect(page.locator('.logout-btn')).toBeVisible();
  });

  test('logout clears the session', async ({ page }) => {
    await login(page);
    await page.getByRole('button', { name: /Профиль/ }).click();
    await page.locator('.logout-btn').click();

    await expect(page).toHaveURL(/\/auth\/login\?.*lang=ru/);
    await expect.poll(() => page.evaluate(() => localStorage.getItem('token'))).toBeNull();
  });
});
