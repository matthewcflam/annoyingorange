import { defineConfig, devices } from '@playwright/test'

const CI = !!process.env.CI
const PORT = 4173

/**
 * Browser tests (e2e/) against the production build, served by `vite
 * preview`. Locally the server builds first; CI has already built.
 *
 * Screenshot baselines are per platform, and CI's (Linux) are made in the
 * Playwright Docker image: `npm run test:e2e:snapshots` (scripts/e2e-snapshots.mjs).
 * The licensed Helvetica Rounded file isn't in git, so every baseline shows
 * its fallback font.
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: CI ? 2 : undefined,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 30_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.002, animations: 'disabled', caret: 'hide', stylePath: './e2e/screenshot.css' },
  },
  snapshotPathTemplate: '{testDir}/__screenshots__/{platform}/{projectName}/{arg}{ext}',
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1767, height: 1024 },
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1767, height: 1024 },
        // Text anti-aliasing otherwise flips between LCD and greyscale with
        // how layers happen to composite, which breaks screenshot compares.
        launchOptions: { args: ['--disable-lcd-text', '--force-color-profile=srgb', '--font-render-hinting=none'] },
      },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], viewport: { width: 1767, height: 1024 } },
      // One set of baselines is enough: the screenshots run in Chromium only.
      grepInvert: /@snapshot/,
      // WebGL is software-rendered here, so the cover runs slowly under load.
      timeout: 60_000,
    },
  ],
  webServer: {
    command: CI ? `npm run preview -- --port ${PORT} --strictPort` : `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    port: PORT,
    reuseExistingServer: !CI,
    timeout: 180_000,
  },
})
