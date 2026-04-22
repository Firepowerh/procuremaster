import { test, expect } from '@playwright/test'

test.describe('404 Not Found page', () => {
  test('shows custom 404 for a nonexistent route', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-xyz')
    await expect(page.getByText('404')).toBeVisible()
    await expect(page.getByText(/page not found/i)).toBeVisible()
  })

  test('has a link to the dashboard', async ({ page }) => {
    await page.goto('/nonexistent-page')
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible()
  })
})
