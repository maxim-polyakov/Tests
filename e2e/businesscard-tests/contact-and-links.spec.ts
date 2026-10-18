import { expect, test } from '@playwright/test';

test.describe('businessCard contact form and portfolio links', () => {
  test('browser validation blocks an invalid contact request', async ({ page }) => {
    await page.goto('/?lang=en#contacts');

    await page.locator('input[name="name"]').fill('A');
    await page.locator('input[name="email"]').fill('not-an-email');
    await page.locator('textarea[name="message"]').fill('Hi');
    await page.locator('input[name="consent"]').check();

    const validation = await page.locator('form').evaluate((form: HTMLFormElement) => ({
      valid: form.checkValidity(),
      nameTooShort: (form.elements.namedItem('name') as HTMLInputElement).validity.tooShort,
      emailMismatch: (form.elements.namedItem('email') as HTMLInputElement).validity.typeMismatch,
      messageTooShort: (form.elements.namedItem('message') as HTMLTextAreaElement).validity.tooShort,
    }));
    expect(validation.valid).toBe(false);
    expect(validation.nameTooShort).toBe(true);
    expect(validation.emailMismatch).toBe(true);
    expect(validation.messageTooShort).toBe(true);
  });

  test('project, email and social links are configured', async ({ page }) => {
    await page.goto('/?lang=ru');

    await expect(page.locator('a[href="https://misa.baxic.ru/"]')).toBeVisible();
    await expect(page.locator('a[href="https://ecommerce.baxic.ru"]')).toBeVisible();
    await expect(page.locator('a[href="mailto:maxim7012@gmail.com"]')).toBeVisible();
    await expect(page.locator('a[href="https://github.com/maxim-polyakov"]')).toBeVisible();
    await expect(page.locator('a[href="https://t.me/The_Baxic"]')).toBeVisible();
  });
});
