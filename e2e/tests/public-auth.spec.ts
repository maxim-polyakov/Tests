import { expect, test } from '@playwright/test';

test.describe('Public authentication controls', () => {
  test('login, registration and recovery validation', async ({ page }) => {
    await page.goto('/login?lang=ru');
    await expect(page.getByRole('heading', { name: 'Авторизация' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Войти' })).toBeDisabled();

    await page.getByRole('link', { name: 'Регистрация' }).click();
    await expect(page).toHaveURL(/\/registration\?lang=ru$/);
    await page.getByPlaceholder('Введите email').fill('invalid-email');
    await page.getByPlaceholder('Введите пароль').fill('123456');
    await page.getByRole('button', { name: 'Зарегистрироваться' }).click();
    await expect(page.getByText('Введите корректный email адрес')).toBeVisible();

    await page.goto('/forgot-password?lang=ru');
    await expect(page.getByRole('heading', { name: 'Восстановление пароля' })).toBeVisible();
    await page.getByPlaceholder('Введите email').fill('invalid-email');
    await page.getByRole('button', { name: 'Отправить код' }).click();
    await expect(page.getByText('Введите корректный email')).toBeVisible();
    await page.getByRole('link', { name: 'Назад к входу' }).click();
    await expect(page).toHaveURL(/\/login\?lang=ru$/);
  });

  test('verification pages handle expired sessions', async ({ page }) => {
    await page.goto('/registration/verify?lang=ru');
    await expect(page.getByText(/Сессия истекла/)).toBeVisible();
    await page.getByRole('link', { name: 'Вернуться к регистрации' }).click();
    await expect(page).toHaveURL(/\/registration/);

    await page.goto('/forgot-password/verify?lang=ru');
    await expect(page.getByText(/Сессия истекла/)).toBeVisible();
    await page.getByRole('link', { name: 'Восстановить пароль' }).click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });

  test('Google OAuth button starts the external flow', async ({ page }) => {
    await page.goto('/login?lang=ru');
    const google = page.getByRole('link', { name: 'Войти через Google' });
    await expect(google).toHaveAttribute('href', /\/auth\/oauth\/google\/$/);

    await google.click();
    await expect(page).toHaveURL(/accounts\.google\.com|oauth_error|misaapi\.baxic\.ru/);
  });
});
