import { API_URL } from '../playwright.config'
import { expect, hydrated, test } from './fixtures'

test.beforeEach(async ({ page }) => {
  await page.goto('/app/profile')
  await hydrated(page)
})

test('changes the password', async ({ page, request, account }) => {
  await page.getByLabel('Current password').fill(account.password)
  await page.getByLabel('New password', { exact: true }).fill('a-new-password')
  await page.getByLabel('Confirm new password').fill('a-new-password')
  await page.getByRole('button', { name: 'Change password' }).click()
  await expect(page.getByText('Password changed.')).toBeVisible()

  const login = await request.post(`${API_URL}/auth/login`, {
    data: { email: account.email, password: 'a-new-password' },
  })
  expect(login.ok()).toBe(true)
})

test('switches the language to Spanish', async ({ page }) => {
  await page.getByRole('button', { name: 'Español' }).click()
  await expect(page).toHaveURL(/\/es\/app\/profile\/?$/)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Tu perfil' }),
  ).toBeVisible()
})

test('deletes the account, confirmed with its password', async ({
  page,
  request,
  account,
}) => {
  await page.getByRole('button', { name: 'Delete account' }).click()
  const dialog = page.getByRole('dialog', { name: 'Delete your account?' })
  await dialog.getByLabel('Password').fill(account.password)
  await dialog.getByRole('button', { name: 'Delete permanently' }).click()
  await expect(page).toHaveURL(/\/$/)

  const login = await request.post(`${API_URL}/auth/login`, { data: account })
  expect(login.ok()).toBe(false)
})
