import { defineConfig, devices } from '@playwright/test'

const PORT = {{port}}
const DEPLOYED_URL = process.env.E2E_BASE_URL
const BASE_URL = DEPLOYED_URL ?? `http://127.0.0.1:${PORT}`

const NEXT_DIST = '.next-e2e'

const NEXT_COMMAND = [
  `NEXT_DIST_DIR=${NEXT_DIST} NEXT_PUBLIC_API_MODE=mock pnpm exec next build`,
  `node scripts/serve-export.mjs ${NEXT_DIST} ${PORT}`,
].join(' && ')

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'mobile',
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } },
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: DEPLOYED_URL
    ? undefined
    : {
        command: NEXT_COMMAND,
        url: BASE_URL,
        reuseExistingServer: false,
        timeout: 180_000,
      },
})
