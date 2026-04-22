import { test, expect } from '@playwright/test'

/**
 * Vendor portal tests.
 * The vendor portal (/vendor/portal) is accessible without a standard app session
 * — vendors log in via magic link / invite token, not the main auth flow.
 * These tests verify the page loads and shows the correct structure.
 */

test.describe('Vendor portal', () => {
  test('renders without crashing (unauthenticated vendor sees redirect or portal)', async ({
    page,
  }) => {
    const response = await page.goto('/vendor/portal')
    // Should either load the portal (200) or redirect to login (200 after redirect)
    expect(response?.status()).toBeLessThan(500)
  })

  test('page title includes ProcureMaster', async ({ page }) => {
    await page.goto('/vendor/portal')
    await expect(page).toHaveTitle(/ProcureMaster/)
  })
})
