import { expect, test } from '@playwright/test';

test.describe('MisaGallery public authentication', () => {
  test('login and registration pages validate input', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle("Misa's drawings");
    await expect(page.locator('form')).toBeVisible();

    const submit = page.locator('button.btn-outline-success');
    await expect(submit).toBeDisabled();
    await page.locator('input').nth(0).fill('invalid-email');
    await page.locator('input').nth(1).fill('123456');
    await submit.click();
    await expect(page.locator('.alert-danger')).toBeVisible();

    await page.locator('a[href="/registration"]').click();
    await expect(page).toHaveURL(/\/registration$/);
    await expect(page.locator('form')).toBeVisible();
  });

  test('anonymous gallery access redirects to login', async ({ page }) => {
    await page.goto('/gallery');
    await expect(page).toHaveURL(/\/login$/);
  });
});
