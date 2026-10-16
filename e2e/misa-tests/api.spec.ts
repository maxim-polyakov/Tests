import { expect, request, test } from '@playwright/test';

const apiBaseUrl = process.env.MISA_API_URL ?? 'https://misaapi.baxic.ru';

test.describe('Misa API', () => {
  test('health, schema and authorization boundaries', async () => {
    const api = await request.newContext({ baseURL: apiBaseUrl });

    const home = await api.get('/');
    expect(home.ok()).toBeTruthy();
    await expect(home.text()).resolves.toContain('Django server is working!');

    const schema = await api.get('/schema/');
    expect(schema.ok()).toBeTruthy();
    expect((await schema.json()).openapi).toBeTruthy();

    const unauthorized = await api.get('/api/chats/');
    expect([401, 403]).toContain(unauthorized.status());

    const invalidLogin = await api.post('/auth/login/', {
      data: { email: 'invalid@example.com', password: 'wrong-password' },
    });
    expect([400, 401, 404]).toContain(invalidLogin.status());

    await api.dispose();
  });

  test('authenticated profile, chats and export endpoints', async () => {
    const email = process.env.MISA_TEST_EMAIL;
    const password = process.env.MISA_TEST_PASSWORD;
    if (!email || !password) {
      throw new Error('MISA_TEST_EMAIL and MISA_TEST_PASSWORD are required');
    }

    const api = await request.newContext({ baseURL: apiBaseUrl });
    const login = await api.post('/auth/login/', { data: { email, password } });
    expect(login.ok()).toBeTruthy();
    const loginBody = await login.json();
    const token = loginBody?.data?.token ?? loginBody?.token;
    expect(token).toBeTruthy();

    const authorized = await request.newContext({
      baseURL: apiBaseUrl,
      extraHTTPHeaders: { Authorization: `Bearer ${token}` },
    });

    const check = await authorized.get('/auth/check/');
    expect(check.ok()).toBeTruthy();

    const chats = await authorized.get('/api/chats/');
    expect(chats.ok()).toBeTruthy();

    const exported = await authorized.get('/api/chats/export/');
    expect(exported.status(), await exported.text()).toBe(200);

    const locale = await api.post('/api/ui-locale/', { data: { locale: 'ru' } });
    expect(locale.status(), await locale.text()).toBe(200);

    await authorized.dispose();
    await api.dispose();
  });
});
