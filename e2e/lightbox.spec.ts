import { expect, test } from '@playwright/test'
import { instrument, open, pageIsFree, settled, TITLE } from './helpers'

test.beforeEach(({ page }) => instrument(page))

const dialog = (page: import('@playwright/test').Page) => page.getByRole('dialog')

test('a collage piece expands, the arrows step through, Escape closes', async ({ page }) => {
  await open(page, '/projects')
  const pieces = page.locator('section#remind').getByRole('button', { name: /^Expand: / })
  await pieces.first().click()
  await expect(dialog(page)).toBeVisible()
  const count = dialog(page).locator('.lightbox__count')
  await expect(count).toHaveText(/^1 \/ \d+$/)
  const total = Number((await count.textContent())!.split('/')[1])
  expect(total).toBeGreaterThan(1)

  await page.keyboard.press('ArrowRight')
  await expect(count).toHaveText(`2 / ${total}`)
  await dialog(page).getByRole('button', { name: 'Previous' }).click()
  await expect(count).toHaveText(`1 / ${total}`)
  // Wraps around.
  await page.keyboard.press('ArrowLeft')
  await expect(count).toHaveText(`${total} / ${total}`)

  // The page behind is inert while it is open.
  expect(await pageIsFree(page)).toBe(false)
  await page.keyboard.press('Escape')
  await expect(dialog(page)).toBeHidden()
  await expect.poll(() => pageIsFree(page)).toBe(true)
})

test('Close shrinks it back', async ({ page }) => {
  await open(page, '/projects')
  await page.getByRole('button', { name: /^Expand: / }).first().click()
  await dialog(page).getByRole('button', { name: 'Close' }).click()
  await expect(dialog(page)).toBeHidden()
})

test('Back while it is open leaves the page cleanly', async ({ page }) => {
  await open(page, '/')
  await page.goto('/projects')
  await expect(page.locator('main')).toBeVisible()
  await page.getByRole('button', { name: /^Expand: / }).first().click()
  await expect(dialog(page)).toBeVisible()
  await page.goBack()
  await expect(page).toHaveURL('/')
  await expect(page).toHaveTitle(TITLE.home)
  await settled(page)
  await expect(dialog(page)).toHaveCount(0)
  await expect.poll(() => pageIsFree(page)).toBe(true)
})
