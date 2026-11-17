import {
  test as base,
  expect,
  type APIRequestContext,
  type Page,
} from '@playwright/test'
import { STORAGE_PREFIX, authResponseSchema } from '@app/shared'
import { API_URL } from '../playwright.config'

interface Account {
  email: string
  password: string
}

// `account`: a new verified user, for this test alone, an administrator if the
// test sets `admin: true`. `page` opens signed in as them, unless the test sets
// `signedIn: false`.
export const test = base.extend<{
  account: Account
  admin: boolean
  signedIn: boolean
}>({
  admin: [false, { option: true }],
  signedIn: [true, { option: true }],
  // Every test comes from an address of its own, as different users would,
  // so the API's limits per address (failed logins, sign-ups) don't add up
  // across the suite. The e2e API trusts one proxy hop to read it.
  // Playwright reads a fixture's dependencies from its first argument, which
  // must be an object pattern even when there are none.
  // eslint-disable-next-line no-empty-pattern
  extraHTTPHeaders: async ({}, use) => {
    const byte = () => Math.floor(Math.random() * 256)
    await use({ 'X-Forwarded-For': `10.${byte()}.${byte()}.${byte()}` })
  },
  account: async ({ request, admin }, use) => {
    const response = await request.post(`${API_URL}/e2e/accounts`, {
      data: { admin },
    })
    expect(response.ok()).toBe(true)
    await use((await response.json()).data)
  },
  page: async ({ page, request, account, signedIn }, use) => {
    // Nothing leaves the machine: Google's sign-in button, for one, would.
    await page.route(
      (url) => url.hostname !== 'localhost',
      (route) => route.abort(),
    )
    if (!signedIn) return use(page)
    const response = await request.post(`${API_URL}/auth/login`, {
      data: account,
    })
    expect(response.ok()).toBe(true)
    const { token, user } = authResponseSchema.parse(
      (await response.json()).data,
    )
    // As the login form leaves it (see apps/web/src/services/session.ts).
    // Once per tab: the script runs on every page load, and setting it again
    // would undo what the test does to the session (logging out, deleting
    // the account, changing the language).
    await page.addInitScript(
      ({ prefix, token, user }) => {
        if (sessionStorage.getItem('e2e.signedIn')) return
        sessionStorage.setItem('e2e.signedIn', 'yes')
        localStorage.setItem(`${prefix}.token`, token)
        localStorage.setItem(`${prefix}.user`, JSON.stringify(user))
      },
      { prefix: STORAGE_PREFIX, token, user },
    )
    await use(page)
  },
})

export { expect }

// Astro renders the islands on the server and Vue takes them over in the
// browser: typing into a form before that is lost when it does.
export async function hydrated(page: Page): Promise<void> {
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0)
}

// Google's script stood in for: its button, "Sign in with Google", signs in
// as `email`, handing the app the credential the e2e API takes as that
// address's Google account (apps/api/tests/e2e/server.ts).
export async function googleAs(page: Page, email: string): Promise<void> {
  await page.route('https://accounts.google.com/gsi/client', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `
        let signedIn
        window.google = { accounts: { id: {
          initialize: (config) => { signedIn = config.callback },
          renderButton: (element) => {
            const button = document.createElement('button')
            button.type = 'button'
            button.textContent = 'Sign in with Google'
            button.onclick = () =>
              signedIn({ credential: 'fake-google:' + ${JSON.stringify(email)} })
            element.append(button)
          },
        } } }
      `,
    }),
  )
}

// The link in the last email of that kind sent to `to`: the confirmation in
// the welcome email, or the password reset.
export async function emailLink(
  request: APIRequestContext,
  kind: 'welcome' | 'reset',
  to: string,
): Promise<string> {
  const response = await request.get(`${API_URL}/e2e/emails/${kind}`, {
    params: { to },
  })
  expect(response.ok()).toBe(true)
  return (await response.json()).data
}
