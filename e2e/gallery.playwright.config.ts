import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './gallery-tests',
  fullyParallel: false,
  workers: 1,
  retries: 1,
  timeout: 90_000,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'gallery-playwright-report', open: 'never' }],
    ['./wrighttest-reporter.ts'],
  ],
  use: {
    baseURL: process.env.GALLERY_BASE_URL ?? 'https://misagallery.baxic.ru',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'ru-RU',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  outputDir: 'gallery-test-results',
});
