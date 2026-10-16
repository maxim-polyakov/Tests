import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './ecommerce-tests',
  fullyParallel: false,
  workers: 1,
  retries: 1,
  timeout: 90_000,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'ecommerce-playwright-report', open: 'never' }],
    ['./wrighttest-reporter.ts'],
  ],
  use: {
    baseURL: process.env.ECOMMERCE_BASE_URL ?? 'https://ecommerce.baxic.ru',
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
  outputDir: 'ecommerce-test-results',
});
