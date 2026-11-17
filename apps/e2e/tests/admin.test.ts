import { API_URL } from '../playwright.config'
import { expect, hydrated, test } from './fixtures'

test.describe('as an administrator', () => {
  test.use({ admin: true })

  test('finds an account by its email and deletes it', async ({
    page,
    request,
  }) => {
    const created = await request.post(`${API_URL}/e2e/accounts`)
    const other: { email: string } = (await created.json()).data

    await page.goto('/admin')
    await hydrated(page)
    await page
      .getByRole('searchbox', { name: 'Search by email' })
      .fill(other.email)
    await page.keyboard.press('Enter')
    const row = page.getByRole('row').filter({ hasText: other.email })
    await expect(row).toHaveCount(1)

    await row.getByRole('button', { name: 'Delete user' }).click()
    await page
      .getByRole('dialog', { name: 'Delete this user?' })
      .getByRole('button', { name: 'Delete user' })
      .click()
    await expect(page.getByText('No users match.')).toBeVisible()
  })

  test('shows the sign-up metrics', async ({ page }) => {
    await page.goto('/admin')
    await hydrated(page)
    await page.getByRole('tab', { name: 'Metrics' }).click()
    await expect(page.getByText('Last 12 weeks')).toBeVisible()
  })
})

test('an account without the role is turned away', async ({ page }) => {
  await page.goto('/admin')
  await expect(
    page.getByText('This page is for administrators only.'),
  ).toBeVisible()
})
