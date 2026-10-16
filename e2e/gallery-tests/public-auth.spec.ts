import { expect, test } from '@playwright/test';

test.describe('MisaGallery public authentication', () => {
  test('login and registration pages validate input', async ({ page }) => {
    await page.goto('/login?lang=ru');
    await expect(page).toHaveTitle('Галерея Misa');
    await expect(page.locator('form')).toBeVisible();

    const submit = page.locator('button.btn-outline-success');
    await expect(submit).toBeDisabled();
    await page.locator('input').nth(0).fill('invalid-email');
    await page.locator('input').nth(1).fill('123456');
    await submit.click();
    await expect(page.locator('.alert-danger')).toBeVisible();

    await page.locator('a[href^="/registration?"]').click();
    await expect(page).toHaveURL(/\/registration\?.*lang=ru/);
    await expect(page.locator('form')).toBeVisible();
  });

  test('anonymous gallery access redirects to login', async ({ page }) => {
    await page.goto('/gallery?lang=ru');
    await expect(page).toHaveURL(/\/login\?.*lang=ru/);
  });

  test('language switch updates URL and localized metadata', async ({ page, request }) => {
    await page.goto('/login?lang=ru');
    await page.locator('.gallery-language-select').selectOption('en');
    await expect(page).toHaveURL(/[?&]lang=en(?:&|$)/);
    await expect(page).toHaveTitle('Misa Gallery');

    const preview = await request.get('/gallery?lang=ru', {
      headers: { 'user-agent': 'Discordbot/2.0' },
    });
    expect(preview.ok()).toBeTruthy();
    const html = await preview.text();
    expect(html).toContain('<meta property="og:title" content="Галерея Misa"');
    expect(html).toContain('<meta property="og:description" content="Рисунки Misa — галерея изображений"');
    expect(html).toContain('https://misagallery.baxic.ru/logo.jpg');
  });
});
