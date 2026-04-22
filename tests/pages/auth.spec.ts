import { test, expect } from '@playwright/test'

/**
 * Authentication & access-control tests.
 * These run against the live app and verify that:
 *  - Protected routes redirect unauthenticated users to /login
 *  - The login page renders the expected UI
 *  - The signup page renders correctly
 *  - Password reset page renders correctly
 */

const PROTECTED_ROUTES = [
  '/dashboard',
  '/requirements',
  '/rfps',
  '/approvals',
  '/contracts',
  '/evaluations',
  '/reports',
  '/vendors',
  '/settings',
]

test.describe('Unauthenticated access', () => {
  for (const route of PROTECTED_ROUTES) {
    test(`GET ${route} redirects to /login`, async ({ page }) => {
      await page.goto(route)
      await expect(page).toHaveURL(/\/login/)
    })
  }
})

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('renders the page title', async ({ page }) => {
    await expect(page).toHaveTitle(/ProcureMaster/)
  })

  test('has email and password fields', async ({ page }) => {
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test('has a submit button', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /sign in|log in/i })
    ).toBeVisible()
  })

  test('has a link to the signup page', async ({ page }) => {
    await expect(page.getByRole('link', { name: /sign up|create account/i })).toBeVisible()
  })

  test('shows validation error for empty submission', async ({ page }) => {
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    // Browser native validation or custom error should appear
    const emailInput = page.getByLabel(/email/i)
    // The email input should be required/invalid
    const validationMsg = await emailInput.evaluate(
      (el) => (el as HTMLInputElement).validationMessage
    )
    expect(validationMsg).not.toBe('')
  })

  test('shows error for invalid credentials', async ({ page }) => {
    await page.getByLabel(/email/i).fill('notexist@example.com')
    await page.getByLabel(/password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /sign in|log in/i }).click()
    // Should show an error message
    await expect(page.getByRole('alert').or(page.locator('[data-sonner-toast]'))).toBeVisible({
      timeout: 5000,
    })
  })
})

test.describe('Signup page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup')
  })

  test('renders the page title', async ({ page }) => {
    await expect(page).toHaveTitle(/ProcureMaster/)
  })

  test('has name, email and password fields', async ({ page }) => {
    await expect(page.getByLabel(/full name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test('has a link back to login', async ({ page }) => {
    await expect(page.getByRole('link', { name: /sign in|log in/i })).toBeVisible()
  })
})

test.describe('Password reset page', () => {
  test('renders correctly', async ({ page }) => {
    await page.goto('/auth/reset-password')
    await expect(page.getByLabel(/email/i)).toBeVisible()
  })
})
