import { AxeBuilder } from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, test } from '@playwright/test'

const ROUTES = ['/']
const THEME_KEY = '{{name}}:theme'

const watchErrors = (page: Page): string[] => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('response', (response) => {
    const url = response.url()
    if (response.status() >= 400 && !url.endsWith('/favicon.ico')) {
      errors.push(`${response.status()} ${url}`)
    }
  })
  return errors
}

for (const route of ROUTES) {
  test(`${route} renders cleanly`, async ({ page }) => {
    const errors = watchErrors(page)
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        document.documentElement.setAttribute(
          'data-theme-at-dcl',
          document.documentElement.dataset.theme ?? '',
        )
      })
    })
    await page.goto(route)
    await expect(page.locator('h1')).toHaveCount(1)
    await expect(page.locator('html')).not.toHaveAttribute('data-theme-at-dcl', '')
    const results = await new AxeBuilder({ page }).analyze()
    const serious = results.violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    )
    expect(serious.map((violation) => violation.id)).toEqual([])
    expect(errors).toEqual([])
  })

  test(`${route} paints the stored dark theme first`, async ({ page }) => {
    await page.addInitScript((key) => {
      window.localStorage.setItem(key, 'dark')
      document.addEventListener('DOMContentLoaded', () => {
        document.documentElement.setAttribute(
          'data-theme-at-dcl',
          document.documentElement.dataset.theme ?? '',
        )
      })
    }, THEME_KEY)
    await page.goto(route)
    await expect(page.locator('html')).toHaveAttribute('data-theme-at-dcl', 'dark')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })
}
