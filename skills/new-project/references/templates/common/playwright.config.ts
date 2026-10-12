import { existsSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

const PORT = {{port}}
const BASE_URL = `http://127.0.0.1:${PORT}`
const IS_NEXT = existsSync('next.config.ts')

const NEXT_DIST = '.next-e2e'

const NEXT_COMMAND = [
  `NEXT_DIST_DIR=${NEXT_DIST} NEXT_PUBLIC_API_MODE=mock pnpm exec next build`,
  `rm -rf ${NEXT_DIST}/standalone/public ${NEXT_DIST}/standalone/${NEXT_DIST}/static`,
  `cp -R public ${NEXT_DIST}/standalone/public`,
  `cp -R ${NEXT_DIST}/static ${NEXT_DIST}/standalone/${NEXT_DIST}/static`,
  `PORT=${PORT} HOSTNAME=127.0.0.1 node ${NEXT_DIST}/standalone/server.js`,
].join(' && ')

const VITE_COMMAND = [
  'pnpm exec vite build --mode e2e --outDir dist-e2e',
  `pnpm exec vite preview --mode e2e --outDir dist-e2e --host 127.0.0.1 --port ${PORT} --strictPort`,
].join(' && ')

const SERVER_COMMAND = IS_NEXT ? NEXT_COMMAND : VITE_COMMAND

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
  webServer: {
    command: SERVER_COMMAND,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 180_000,
  },
})
