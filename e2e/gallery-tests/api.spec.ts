import { expect, request, test } from '@playwright/test';

const apiBaseUrl = process.env.GALLERY_API_URL ?? 'https://gallery.baxic.ru';

test.describe('MisaGallery API', () => {
  test('public image catalogue and files are available', async () => {
    const api = await request.newContext({ baseURL: apiBaseUrl });
    const response = await api.get('/api/images');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(Array.isArray(body.images)).toBeTruthy();
    expect(body.images.length).toBeGreaterThan(0);
    expect(body.backgroundUrl).toMatch(/^https:\/\//);

    const image = await api.get(body.images[0].url);
    expect(image.ok()).toBeTruthy();
    expect(image.headers()['content-type']).toMatch(/^image\//);
    await api.dispose();
  });

  test('login and authorization boundaries work', async () => {
    const email = process.env.MISA_TEST_EMAIL;
    const password = process.env.MISA_TEST_PASSWORD;
    if (!email || !password) throw new Error('Gallery test credentials are required');

    const api = await request.newContext({ baseURL: apiBaseUrl });
    const login = await api.post('/api/user/login', { data: { email, password } });
    expect(login.ok(), await login.text()).toBeTruthy();
    const { token } = await login.json();
    expect(token).toBeTruthy();

    const authorized = await request.newContext({
      baseURL: apiBaseUrl,
      extraHTTPHeaders: { Authorization: `Bearer ${token}` },
    });
    const auth = await authorized.get('/api/user/auth');
    expect(auth.ok(), await auth.text()).toBeTruthy();

    const anonymousDelete = await api.delete('/api/images/1');
    expect([401, 403]).toContain(anonymousDelete.status());
    await authorized.dispose();
    await api.dispose();
  });
});
