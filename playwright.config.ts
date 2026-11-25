import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

// E2E runs against the production build (mock mode: same bundle shape, BFF simulated by MSW).
export default defineConfig({
  forbidOnly: Boolean(process.env.CI),
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  reporter: process.env.CI ? 'github' : 'list',
  retries: process.env.CI ? 1 : 0,
  testDir: 'e2e',
  use: { baseURL: `http://localhost:${PORT}`, trace: 'on-first-retry' },
  webServer: {
    command: `vite build --mode mock --outDir dist-e2e && vite preview --mode mock --outDir dist-e2e --port ${PORT} --strictPort`,
    reuseExistingServer: !process.env.CI,
    url: `http://localhost:${PORT}`,
  },
});
