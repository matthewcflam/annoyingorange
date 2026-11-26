import { expect, test } from '@playwright/test'
import { instrument, open } from './helpers'

// A phone: the compact layout (config/media.ts COMPACT_QUERY).
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })
test.beforeEach(({ page }) => instrument(page))

for (const path of ['/', '/about', '/experience', '/projects']) {
  test(`${path} stacks on a phone without sideways scroll`, async ({ page }) => {
    await open(page, path)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
    // The page scrolls vertically instead.
    const tall = await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight)
    if (path !== '/about') expect(tall).toBe(true)
    await expect(page.locator('.map-box')).toBeVisible()
  })
}

test('the Map box toggles with a tap', async ({ page }) => {
  await open(page, '/experience')
  const toggle = page.locator('.map-box').getByRole('button', { name: 'Map' })
  await toggle.tap()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await toggle.tap()
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
})
