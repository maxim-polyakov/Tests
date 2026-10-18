import { expect, test } from '@playwright/test';

test.describe('businessCard public page and localization', () => {
  test('portfolio sections and contact form are visible', async ({ page }) => {
    await page.goto('/?lang=ru');

    await expect(page).toHaveTitle('Поляков Максим — Fullstack-разработчик | Портфолио');
    await expect(page.locator('.hero-title')).toBeVisible();
    await expect(page.locator('.profile-panel')).toBeVisible();
    await expect(page.locator('.service-card')).toHaveCount(3);
    await expect(page.locator('.project-card')).toHaveCount(5);
    await expect(page.locator('#contacts form')).toBeVisible();

    const hero = await page.locator('.hero-section').boundingBox();
    const profile = await page.locator('.profile-panel').boundingBox();
    expect(hero).not.toBeNull();
    expect(profile).not.toBeNull();
    expect(profile!.y).toBeGreaterThan((await page.locator('.hero-title').boundingBox())!.y);
  });

  test('language selector updates URL, metadata and content without a globe icon', async ({ page }) => {
    await page.goto('/?lang=ru');

    const picker = page.locator('.business-language-selector');
    const language = picker.locator('select');
    await expect(language).toHaveValue('ru');
    await expect(picker).not.toContainText('🌐');

    await language.selectOption('en');
    await expect(page).toHaveURL(/[?&]lang=en(?:&|$)/);
    await expect(page).toHaveTitle('Maxim Polyakov — Full Stack Developer | Portfolio');
    await expect(page.locator('.hero-title')).toContainText('IT solutions');

    await language.selectOption('ar');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });
});
