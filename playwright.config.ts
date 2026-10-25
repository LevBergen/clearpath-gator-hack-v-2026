import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', timeout: 15000, fullyParallel: false,
  use: { baseURL: 'http://127.0.0.1:4174', channel: 'chrome', viewport: { width: 1440, height: 1000 }, screenshot: 'only-on-failure' },
  webServer: { command: 'PORT=4174 GEMINI_API_KEY= AI_PROVIDER=google npm run dev', url: 'http://127.0.0.1:4174', reuseExistingServer: false, timeout: 30000 },
});
