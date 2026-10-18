import { expect, request, test } from '@playwright/test';

const apiBaseUrl = process.env.BUSINESSCARD_API_URL ?? 'https://baxicapi.baxic.ru';

test.describe('businessCard API and social preview', () => {
  test('health and contact validation are available', async () => {
    const api = await request.newContext({ baseURL: apiBaseUrl });

    const health = await api.get('/api/health');
    expect(health.ok(), await health.text()).toBeTruthy();
    expect(await health.json()).toEqual({ status: 'ok' });

    const invalidContact = await api.post('/api/contact', {
      multipart: {
        name: 'A',
        email: 'invalid-email',
        message: 'Hi',
        consent: 'false',
      },
    });
    expect(invalidContact.status()).toBe(422);
    await api.dispose();
  });

  test('Discord preview is localized and serves a large logo image', async ({ request: web }) => {
    const preview = await web.get('/?lang=de&test=businesscard-preview', {
      headers: { 'user-agent': 'Discordbot/2.0' },
    });
    expect(preview.ok(), await preview.text()).toBeTruthy();
    const html = await preview.text();
    expect(html).toContain('Maxim Polyakov – Full-Stack-Entwickler | Portfolio');
    expect(html).toContain('twitter:card" content="summary_large_image"');
    expect(html).toContain('og:image:width" content="1536"');
    expect(html).toContain('https://baxic.ru/baxic-logo-card.jpg');

    const image = await web.get('/baxic-logo-card.jpg', {
      headers: { 'user-agent': 'Discordbot/2.0' },
    });
    expect(image.ok()).toBeTruthy();
    expect(image.headers()['content-type']).toBe('image/jpeg');
    expect(Number(image.headers()['content-length'])).toBeGreaterThan(10_000);
    expect((await image.body()).byteLength).toBeGreaterThan(10_000);
  });
});
