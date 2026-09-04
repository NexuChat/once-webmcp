import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4178',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    launchOptions: { args: ['--enable-features=WebMCP'] },
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:4178',
    reuseExistingServer: true,
  },
  projects: [
    {
      name: 'desktop-1440',
      testMatch: '**/*.spec.ts',
      use: { browserName: 'chromium', viewport: { width: 1440, height: 1100 } },
    },
    {
      name: 'tablet-768',
      testMatch: '**/journey.spec.ts',
      use: { browserName: 'chromium', viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'mobile-375',
      testMatch: '**/journey.spec.ts',
      use: { browserName: 'chromium', viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true },
    },
  ],
})
