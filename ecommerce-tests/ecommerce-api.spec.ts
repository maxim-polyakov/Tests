// @ts-nocheck -- imported into WrightTest; dependencies live in its backend image.
import { expect, request, test } from '@playwright/test';

test('публичное API и авторизация e-commerce работают', async () => {
  const api = await request.newContext({ baseURL: process.env.API_URL });

  const products = await api.get('/product?page=0&size=10');
  expect(products.ok(), await products.text()).toBeTruthy();
  expect(Array.isArray((await products.json()).content)).toBeTruthy();

  const unauthorized = await api.get('/auth/me');
  expect([401, 403]).toContain(unauthorized.status());

  const login = await api.post('/auth/login', {
    data: {
      usernameoremail: process.env.TEST_EMAIL,
      password: process.env.TEST_PASSWORD,
    },
  });
  expect(login.ok(), await login.text()).toBeTruthy();
  const jwt = (await login.json()).jwt;
  expect(jwt).toBeTruthy();

  const authorized = await request.newContext({
    baseURL: process.env.API_URL,
    extraHTTPHeaders: { Authorization: `Bearer ${jwt}` },
  });
  const profile = await authorized.get('/auth/me');
  expect(profile.ok(), await profile.text()).toBeTruthy();
  expect((await profile.json()).email).toBe(process.env.TEST_EMAIL);

  await authorized.dispose();
  await api.dispose();
});

test('публичное превью локализуется через lang', async () => {
  const api = await request.newContext({ baseURL: process.env.API_URL });
  const preview = await api.get('/og/preview?lang=en');
  expect(preview.ok(), await preview.text()).toBeTruthy();
  const html = await preview.text();
  expect(html).toContain('Baxic');
  expect(html).toContain('Online Store');
  await api.dispose();
});
