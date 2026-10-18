import { expect, test } from '@playwright/test';

test.describe('Canban localization and social preview', () => {
  test('language selector exposes the Misa language pack and updates URL', async ({ page }) => {
    await page.goto('/login?lang=ru');

    const picker = page.locator('.language-selector');
    const language = picker.locator('select');
    await expect(language).toHaveValue('ru');
    await expect(language.locator('option')).toHaveCount(76);
    await expect(picker).not.toContainText('🌐');

    await language.selectOption('en');
    await expect(page).toHaveURL(/\/login\?.*lang=en/);
    await expect(page.locator('.auth-form h1')).toHaveText('Sign in');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');

    await page.reload();
    await expect(page.locator('.language-selector select')).toHaveValue('en');
  });

  test('RTL language updates document direction', async ({ page }) => {
    await page.goto('/login?lang=ar');

    await expect(page.locator('.language-selector select')).toHaveValue('ar');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });

  test('Discord preview is localized and serves the large Kanban logo', async ({ request }) => {
    const preview = await request.get('/?lang=en&test=canban-preview', {
      headers: { 'user-agent': 'Discordbot/2.0' },
    });
    expect(preview.ok(), await preview.text()).toBeTruthy();

    const html = await preview.text();
    expect(html).toContain('<meta property="og:title" content="Kanban — Quests and levels"');
    expect(html).toContain('twitter:card" content="summary_large_image"');
    expect(html).toContain('og:image:width" content="1024"');
    expect(html).toContain('https://canban.baxic.ru/canban-preview.png');

    const image = await request.get('/canban-preview.png', {
      headers: { 'user-agent': 'Discordbot/2.0' },
    });
    expect(image.ok()).toBeTruthy();
    expect(image.headers()['content-type']).toBe('image/png');
    expect(Number(image.headers()['content-length'])).toBeGreaterThan(100_000);
    expect((await image.body()).byteLength).toBeGreaterThan(100_000);
  });
});
