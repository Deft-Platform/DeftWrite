import { defineConfig, devices } from '@playwright/test';

// Dedicated test port so the suite never collides with a dev server you're
// running by hand (vite dev usually lands on 5173/5174).
const PORT = Number(process.env.QA_PORT || 5199);
const BASE_URL = process.env.QA_BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 30000,
  expect: { timeout: 10000 },
  use: {
    baseURL: BASE_URL,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  outputDir: 'test-results/',
  reporter: [['list'], ['html', { open: 'never' }]],
  // Boot the dev server (with the /halo AI proxy) for the run, unless one is
  // already serving BASE_URL. AI tests need the proxy, so this is the dev server.
  webServer: process.env.QA_BASE_URL
    ? undefined
    : {
        command: `DEFTWRITE_NO_OPEN=1 bunx vite --port ${PORT} --strictPort`,
        url: BASE_URL,
        timeout: 60000,
        reuseExistingServer: !process.env.CI,
        stdout: 'ignore',
        stderr: 'pipe',
      },
});
