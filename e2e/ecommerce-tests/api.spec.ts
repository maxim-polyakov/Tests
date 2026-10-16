import { expect, request, test } from '@playwright/test';

const apiBaseUrl = process.env.ECOMMERCE_API_URL ?? 'https://ecommerceapi.baxic.ru';

test.describe('E-commerce API', () => {
  test('public products, preview and authorization boundary', async () => {
    const api = await request.newContext({ baseURL: apiBaseUrl });

    const products = await api.get('/product?page=0&size=10');
    expect(products.ok(), await products.text()).toBeTruthy();
    expect(Array.isArray((await products.json()).content)).toBeTruthy();

    const preview = await api.get('/og/preview?lang=en');
    expect(preview.ok(), await preview.text()).toBeTruthy();
    expect(await preview.text()).toContain('Online Store');

    const unauthorized = await api.get('/auth/me');
    expect([401, 403]).toContain(unauthorized.status());
    await api.dispose();
  });

  test('test account can log in and read its profile', async () => {
    const email = process.env.ECOMMERCE_TEST_EMAIL;
    const password = process.env.ECOMMERCE_TEST_PASSWORD;
    if (!email || !password) throw new Error('E-commerce test credentials are required');

    const api = await request.newContext({ baseURL: apiBaseUrl });
    const login = await api.post('/auth/login', {
      data: { usernameoremail: email, password },
    });
    expect(login.ok(), await login.text()).toBeTruthy();
    const jwt = (await login.json()).jwt;
    expect(jwt).toBeTruthy();

    const authorized = await request.newContext({
      baseURL: apiBaseUrl,
      extraHTTPHeaders: { Authorization: `Bearer ${jwt}` },
    });
    const profile = await authorized.get('/auth/me');
    expect(profile.ok(), await profile.text()).toBeTruthy();
    expect((await profile.json()).email).toBe(email);

    await authorized.dispose();
    await api.dispose();
  });
});
