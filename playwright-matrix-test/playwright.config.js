const { defineConfig, devices } = require('@playwright/test');
require('dotenv').config();

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60_000,             // 60с на весь тест — логин + UI может быть медленным
  expect: { timeout: 15_000 }, // явный таймаут на каждый expect
  retries: 1,                  // 1 повтор при нестабильности окружения
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: process.env.ELEMENT_URL ?? 'https://app.element.io',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});