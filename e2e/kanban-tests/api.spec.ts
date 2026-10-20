import { expect, request, test } from '@playwright/test';

const apiBaseUrl = process.env.KANBAN_API_URL ?? 'https://kanbanapi.baxic.ru';

test.describe('Kanban API', () => {
  test('authorization boundary and invalid login work', async () => {
    const api = await request.newContext({ baseURL: apiBaseUrl });

    const anonymousProfile = await api.get('/api/auth/me');
    expect(anonymousProfile.status()).toBe(401);

    const invalidLogin = await api.post('/api/auth/login', {
      data: {
        email: 'missing-kanban-user@example.invalid',
        password: 'wrong-password',
      },
    });
    expect(invalidLogin.status()).toBe(401);
    expect(await invalidLogin.text()).toContain('Неверный email или пароль');

    const invalidRegistration = await api.post('/api/auth/register', {
      data: { email: '', password: '', displayName: '' },
    });
    expect(invalidRegistration.status()).toBe(400);
    expect(await invalidRegistration.text()).toContain('Email и пароль обязательны');

    await api.dispose();
  });
});
