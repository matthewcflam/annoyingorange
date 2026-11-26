import { expect, test, type Page } from '@playwright/test'
import { instrument, open } from './helpers'

/**
 * Each page's finished state, compared with a baseline (e2e/__screenshots__).
 * Reduced motion makes every entrance instant, and helpers.instrument seeds
 * Math.random, so the "who?" spray repeats. Chromium only (see
 * playwright.config.ts). Update with `npm run test:e2e:snapshots`.
 */
test.use({ reducedMotion: 'reduce' })
test.beforeEach(({ page }) => instrument(page))

/** Every image decoded and nothing left loading. */
async function loaded(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.evaluate(async () => {
    const imgs = [...document.images].filter((img) => img.loading !== 'lazy' || img.getBoundingClientRect().top < innerHeight)
    await Promise.all(imgs.map((img) => img.decode().catch(() => {})))
  })
}

const SIZES = [
  { name: 'desktop', viewport: { width: 1767, height: 1024 } },
  { name: 'phone', viewport: { width: 390, height: 844 } },
]

const PAGES = [
  ['home', '/'],
  ['about', '/about'],
  ['experience', '/experience'],
  ['projects', '/projects'],
] as const

for (const size of SIZES) {
  test.describe(size.name, () => {
    test.use({ viewport: size.viewport })
    for (const [name, path] of PAGES) {
      test(`${name} (${size.name}) @snapshot`, async ({ page }) => {
        await open(page, path)
        await loaded(page)
        // The first screen only: below it, lazy images and the footer's
        // scroll reveal would need scrolling to settle.
        await expect(page).toHaveScreenshot(`${name}-${size.name}.png`)
      })
    }
  })
}
