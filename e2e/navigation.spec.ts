import { expect, test, type Page } from '@playwright/test'
import { instrument, open, pageIsFree, settled, TITLE, titles } from './helpers'

test.beforeEach(({ page }) => instrument(page))

const PAGES = [
  { path: '/', title: TITLE.home, text: 'Matthew Lam' },
  { path: '/about', title: TITLE.about, text: 'Nice to meet you!' },
  { path: '/experience', title: TITLE.experience, text: 'EnerSys' },
  { path: '/projects', title: TITLE.projects, text: 'ReMind' },
] as const

for (const p of PAGES) {
  test(`${p.path} loads without errors`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    page.on('response', (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`))
    await open(page, p.path)
    await expect(page).toHaveTitle(p.title)
    await expect(page.locator('main').getByText(p.text).first()).toBeVisible()
    expect(errors).toEqual([])
  })
}

test('unknown paths go home', async ({ page }) => {
  await open(page, '/nowhere')
  await expect(page).toHaveURL('/')
  await expect(page).toHaveTitle(TITLE.home)
})

/** Click a station in the Map box (home's card, or the corner box opened from
 *  the keyboard). */
async function goVia(page: Page, label: string) {
  const box = page.locator('.map-box')
  const toggle = box.getByRole('button', { name: 'Map' })
  if (await toggle.count()) {
    await toggle.focus()
    await page.keyboard.press('Enter')
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  }
  await box.getByRole('link', { name: label, exact: true }).click()
}

test('a transition reaches every station and back home', async ({ page }) => {
  test.slow() // four transitions
  await open(page, '/')
  const route = [
    { label: 'About', url: '/about', title: TITLE.about },
    { label: 'Experience', url: '/experience', title: TITLE.experience },
    { label: 'Projects', url: '/projects', title: TITLE.projects },
    { label: 'Home', url: '/', title: TITLE.home },
  ]
  for (const step of route) {
    await goVia(page, step.label)
    // The URL moves at the click, the page at the cover.
    await expect(page).toHaveURL(step.url)
    await expect(page).toHaveTitle(step.title)
    await settled(page)
    expect(await pageIsFree(page)).toBe(true)
    // After a page change, focus goes to <main> for screen readers.
    await expect(page.locator('main')).toBeFocused()
  }
  // One commit per transition.
  expect(await titles(page)).toHaveLength(route.length)
})

test('Back mid-transition: the latest entry wins, with a single commit', async ({ page }) => {
  await open(page, '/')
  await goVia(page, 'About')
  await expect(page).toHaveURL('/about')
  // Back to home and forward to About again, both under the cover.
  await page.goBack()
  await page.goForward()
  await expect(page).toHaveTitle(TITLE.about)
  await settled(page)
  await page.waitForTimeout(500) // nothing queued may run after it
  await expect(page).toHaveURL('/about')
  expect(await titles(page)).toEqual([expect.stringMatching(TITLE.about)])
})

test('Back mid-transition to another page runs it next', async ({ page }) => {
  await open(page, '/about')
  await goVia(page, 'Experience')
  await page.goBack()
  await expect(page).toHaveURL('/about')
  await expect(page).toHaveTitle(TITLE.about, { timeout: 15_000 })
  await settled(page)
  const seen = await titles(page)
  expect(seen.at(-1)).toMatch(TITLE.about)
})

test('an old project link opens Projects scrolled to that project', async ({ page }) => {
  await open(page, '/projects/mango')
  await expect(page).toHaveURL('/projects')
  // The project (without its bottom gap) is centred: its top is above the
  // middle of the window and its bottom below.
  const straddlesMiddle = () =>
    page.evaluate(() => {
      const r = document.querySelector('section#mango')?.getBoundingClientRect()
      return !!r && scrollY > 0 && r.top < innerHeight / 2 && r.bottom > innerHeight / 2
    })
  await expect.poll(straddlesMiddle).toBe(true)
  await expect(page.getByRole('navigation', { name: 'Projects' }).getByRole('link', { name: /Mango/ })).toHaveAttribute('aria-current', 'location')
})

test('the Map box opens from the keyboard and closes on Escape', async ({ page, browserName }) => {
  await open(page, '/about')
  const toggle = page.locator('.map-box').getByRole('button', { name: 'Map' })
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await toggle.focus()
  await page.keyboard.press('Enter')
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  const stations = page.getByRole('navigation', { name: 'Stations' })
  await expect(stations.getByRole('link')).toHaveCount(4)
  await expect(stations.getByRole('link', { name: 'About' })).toHaveAttribute('aria-current', 'page')
  // WebKit's Tab skips links by default (as Safari does), so Tab in Chromium.
  if (browserName !== 'webkit') {
    await page.keyboard.press('Tab')
    await expect(stations.getByRole('link', { name: 'Home' })).toBeFocused()
  }
  await page.keyboard.press('Escape')
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await expect(toggle).toBeFocused()
})
