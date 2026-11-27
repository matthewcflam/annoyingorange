import { expect, type Page } from '@playwright/test'

/** The page titles, as App sets them (content/site.ts SITE_NAME follows the dot). */
export const TITLE = {
  home: /^Matthew Lam$/,
  about: /^About · /,
  experience: /^Experience · /,
  projects: /^Projects · /,
} as const

/**
 * Before any page script: a seeded Math.random (the "who?" spray and the
 * typer shuffle draw from it, so screenshots repeat), and a log of every
 * document.title change, one per page commit (window.__titles).
 */
export async function instrument(page: Page): Promise<void> {
  await page.addInitScript(() => {
    let a = 0x9e3779b9
    Math.random = () => {
      a = (a + 0x6d2b79f5) >>> 0
      let t = a
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
    const w = window as unknown as { __titles: string[] }
    w.__titles = []
    document.addEventListener('DOMContentLoaded', () => {
      const el = document.querySelector('title')
      if (el) new MutationObserver(() => w.__titles.push(document.title)).observe(el, { childList: true, characterData: true, subtree: true })
    })
  })
}

/** The titles committed since load (the entry page's own isn't counted). */
export const titles = (page: Page) => page.evaluate(() => (window as unknown as { __titles: string[] }).__titles)

/** Load `path` and wait until the page has faded in (App's root is visible
 *  once fonts are ready) and the page itself has mounted: each page is a
 *  lazy chunk behind `<Suspense fallback={null}>` (pages/Outlet.tsx), so
 *  `<main>` can be visible but still empty. */
export async function open(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await expect(page.locator('main')).toBeVisible()
  await expect(page.locator('main > *').first()).toBeVisible()
  await page.waitForFunction(() => document.fonts.status === 'loaded')
}

/** Wait for a page transition to finish: the dither canvas is hidden again
 *  and the fallback fade clear. Call it after the commit (the title changed),
 *  since before a transition starts it is already true. */
export async function settled(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const canvas = document.querySelector('.transition__canvas')
      const fade = document.querySelector('.transition__fade')
      return (!canvas || getComputedStyle(canvas).visibility === 'hidden') && (!fade || Number(getComputedStyle(fade).opacity) === 0)
    },
    undefined,
    { timeout: 10_000 },
  )
}

/** Is the page free to use: nothing inert, nothing scroll-locked? */
export async function pageIsFree(page: Page): Promise<boolean> {
  return page.evaluate(() => !document.querySelector('[inert]:not(.map-box__panel)') && getComputedStyle(document.documentElement).overflow !== 'hidden' && getComputedStyle(document.body).overflow !== 'hidden')
}
