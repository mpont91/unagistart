import { randomUUID } from 'node:crypto'
import { API_URL } from '../playwright.config'
import { emailLink, expect, hydrated, test } from './fixtures'

test.describe('signed out', () => {
  test.use({ signedIn: false })

  test('signs up with an email and confirms it from the welcome email', async ({
    page,
    request,
  }) => {
    const email = `e2e-${randomUUID()}@example.com`
    await page.goto('/register')
    await hydrated(page)
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password', { exact: true }).fill('a-new-password')
    await page.getByLabel('Confirm password').fill('a-new-password')
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(
      page.getByRole('heading', { name: 'Check your inbox' }),
    ).toBeVisible()

    // The link in the email confirms the address and logs in.
    await page.goto(await emailLink(request, 'welcome', email))
    await expect(page).toHaveURL(/\/app\/?$/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Welcome' }),
    ).toBeVisible()
  })

  test('logs in with a password and logs out', async ({ page, account }) => {
    await page.goto('/login')
    await hydrated(page)
    await page.getByLabel('Email').fill(account.email)
    await page.getByLabel('Password').fill(account.password)
    await page.getByRole('button', { name: 'Log in' }).click()
    await expect(page).toHaveURL(/\/app\/?$/)

    await page.goto('/app/profile')
    await hydrated(page)
    await page.getByRole('button', { name: 'Log out' }).click()
    await expect(page).toHaveURL(/\/$/)
    await page.goto('/app')
    await expect(page).toHaveURL(/\/login/)
  })

  test('resets a forgotten password from the email', async ({
    page,
    request,
    account,
  }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: 'Forgot your password?' }).click()
    await expect(page).toHaveURL(/\/forgot-password\/?$/)
    await hydrated(page)
    await page.getByLabel('Email').fill(account.email)
    await page.getByRole('button', { name: 'Send reset link' }).click()
    await expect(page.getByText("we've sent a reset link")).toBeVisible()

    await page.goto(await emailLink(request, 'reset', account.email))
    await expect(page.getByLabel('Account')).toHaveValue(account.email)
    await page.getByLabel('New password').fill('a-new-password')
    await page.getByLabel('Confirm password').fill('a-new-password')
    await page.getByRole('button', { name: 'Reset password' }).click()
    await expect(page).toHaveURL(/\/app\/?$/)

    const login = await request.post(`${API_URL}/auth/login`, {
      data: { email: account.email, password: 'a-new-password' },
    })
    expect(login.ok()).toBe(true)
  })
})
