# Unagi Start

The base every new project starts from: a monorepo with a typed API contract, an
Express API in hexagonal layers, an Astro + Vue web, and everything a product
needs before its first feature already built, tested and deployable.

What it carries is the set of decisions taken, and proven in production, in the
owner's earlier projects. They're written down so they don't have to be
explained again: the _why_ is in `docs/ARCHITECTURE.md`, the _how_ in the
`CLAUDE.md` files, which Claude Code reads on its own.

**It runs in production as its own demo.** The web is at
[unagistart.mpont91.com](https://unagistart.mpont91.com), on Vercel, and the API
at `api.unagistart.mpont91.com`, on the owner's VPS: this repository as it is,
where anyone can create an account and try what every project starts with. Its
`docs/` describe Unagi Start as a product; the blank ones a new project starts
from are in `docs/templates/`.

## What's inside

| Area       | What you get                                                                                                          |
| ---------- | --------------------------------------------------------------------------------------------------------------------- |
| Monorepo   | npm workspaces: `apps/api`, `apps/web`, `packages/shared` (the Zod contract both apps import). `make` for everything. |
| API        | Express 5, Prisma 7 (PostgreSQL), Zod, TypeScript ESM, Node 26. Hexagonal: domain / application / infrastructure.     |
| Accounts   | Sign-up with email confirmation, login, Google sign-in, logout, password change and reset, delete account.            |
| Security   | Revocable JWT sessions, rate limits on auth and email routes, hashed one-time tokens, data scoped by user.            |
| Admin      | A role granted from the command line, user list, account deletion with an audit trail, weekly sign-up metrics.        |
| Email      | Resend behind a port, one branded layout, every message in English and Spanish.                                       |
| Web        | Astro (static) + Vue 3 islands + Tailwind 4, design tokens, dark-first, UI primitives, English and Spanish routes.    |
| Monitoring | Sentry in the API and the web (nothing personal reported), heap watchdog, crash detection, Vercel Analytics.          |
| Tests      | Unit tests, API integration tests against a real Postgres, Playwright end-to-end tests of every journey.              |
| Deploy     | Docker Compose on a VPS behind Caddy (`make deploy`), migrations from a throwaway container; the web on Vercel.       |
| Backups    | Nightly `pg_dump`, encrypted with `age`, to Backblaze B2; a failure raises a Sentry issue; `make api/restore`.        |
| Docs       | `VISION`, `ROADMAP` and phase spec templates, the decision log, and a `CLAUDE.md` per app.                            |

## Starting a project

### 1. Create the repository

On [the template's page](https://github.com/mpont91/unagistart), **Use this
template → Create a new repository**, then clone it with SSH:

```bash
git clone git@github.com:<owner>/<name>.git
cd <name>
```

The new repository starts from a single commit, without this one's history.

### 2. Make it yours

- [ ] **Name:** `packages/shared/src/brand.ts`, and `COMPOSE_PROJECT_NAME` in
      `apps/api/.env.example`.
- [ ] **Docs:** `docs/VISION.md`, `ROADMAP.md` and the first spec, from the
      blanks in `docs/templates/` (they replace Unagi Start's). Before any code:
      Claude checks every decision against them.
- [ ] **Rules:** the description at the top of the three `CLAUDE.md` files, and
      the security rules in the root one.
- [ ] **Palette:** `apps/web/src/styles/global.css`, and the same colours in the
      API's `email-layout.ts`.
- [ ] **Logo:** `apps/web/src/assets/logo.svg`, and in `apps/web/public/`
      `favicon.svg` and `apple-touch-icon.png` (180×180, used by the emails).
- [ ] **Copy:** the landing and the first screen (`home.*` in
      `apps/web/src/i18n/`, `AppHome.vue`), and their test,
      `apps/e2e/tests/home.test.ts`.
- [ ] **Links:** `CONTACT_EMAIL` and `REPOSITORY_URL` in
      `apps/web/src/constants.ts` (empty hides them).
- [ ] **Legal pages:** `apps/web/src/legal/`, as the comment at the top of each
      says. Reviewed before real users arrive.
- [ ] **This README:** rewrite the top, and remove "Starting a project" and
      "Keeping the template alive". The rest stays: it's the project's too.

## Development

Requirements:

- **Node 26**, the version in `.nvmrc` (`nvm use`).
- **Docker** with Compose: the database runs in it.
- **`make`**: every command goes through it.

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
make install
make dev        # API on :3000 with its database, web on :4321
make check      # the gate: format, lint, typecheck, tests
```

The API doesn't boot without three values in `apps/api/.env`:

- `JWT_SECRET`: a random string, `openssl rand -hex 32`.
- `RESEND_API_KEY`: from Resend (see "Services").
- `GOOGLE_CLIENT_ID`: from Google Cloud (see "Services"), also in
  `apps/web/src/constants.ts`.

Any value works for the last two until the real ones exist; the confirmation
email isn't sent then, so to log in with an account made by email, mark it
confirmed by hand:

```bash
(cd apps/api && docker compose exec db psql -U app -d app \
  -c "UPDATE \"User\" SET \"emailVerifiedAt\" = now() WHERE email = 'you@…'")
```

`make api/grant-admin EMAIL=…` opens the admin panel to an account. If another
project already uses a port, change it in that app's `.env`.

## Services

The providers the owner's projects use, each free at a small product's scale.
Any other works: email, Google sign-in and error reporting sit behind a port in
the API. Each name links to its console.

- [ ] **Domain** on [DonDominio](https://www.dondominio.com/), its nameservers
      pointed at [Vercel](https://vercel.com/dashboard/domains), which holds the
      DNS.
- [ ] **VPS** on [Clouding.io](https://portal.clouding.io/), set up in "Deploy".
- [ ] **[Vercel](https://vercel.com/dashboard):** hosts the web and the DNS.
- [ ] **[Resend](https://resend.com/emails):** the domain verified, an API key →
      `RESEND_API_KEY`.
- [ ] **[Google Cloud](https://console.cloud.google.com/apis/credentials):** a
      "Web application" OAuth client, with the production origin and
      `http://localhost:4321` → `GOOGLE_CLIENT_ID`.
- [ ] **[Sentry](https://sentry.io/)** (EU): a project for the API →
      `SENTRY_DSN`, one for the web → `PUBLIC_SENTRY_DSN`.
- [ ] **[Backblaze B2](https://secure.backblaze.com/b2_buckets.htm)** (EU): a
      private bucket and a _Read and Write_ key restricted to it →
      `BACKUP_B2_KEY_ID`, `BACKUP_B2_APPLICATION_KEY`. Lifecycle: `daily/`
      hidden after 7 days, `weekly/` after 28, deleted a day later.
- [ ] **Backup key:** `age-keygen`. The public key → `BACKUP_AGE_RECIPIENT`; the
      private one only in [Bitwarden](https://vault.bitwarden.com/).
- [ ] **[UptimeRobot](https://dashboard.uptimerobot.com/):** monitors on the web
      and on the API's `/uptime`.

A project then replaces this list with a table of the ones it uses: each one's
console, what it's for and where its key goes.

## Deploy

The first deploy, from zero, once the services above are set up. Written with
this project's values: the web at `unagistart.mpont91.com`, the API at
`api.unagistart.mpont91.com`, the repository `mpont91/unagistart`; a project
changes them for its own. `<ip>` is the server's address, used only for the DNS:
everything else reaches the server by its name.

**The server** needs Docker (with Compose), git, `make` and Caddy, the reverse
proxy, and nothing else: everything the project runs there runs in a container.

1. **Create the VPS** on Clouding: Ubuntu, latest LTS, with your SSH public key.
   In its firewall, open only ports 22, 80 and 443.
2. **Point the API's name at it.** In Vercel's DNS for `mpont91.com`, an `A`
   record `api.unagistart` → `<ip>`
   (`vercel dns add mpont91.com api.unagistart A <ip>`). Wait until
   `dig +short api.unagistart.mpont91.com` prints `<ip>`: Caddy can't get a
   certificate before.
3. **Tell your machine where it is.** In your local `apps/api/.env`:

   ```bash
   SERVER_SSH=root@api.unagistart.mpont91.com
   SERVER_PATH=/root/unagistart
   ```

   From then on, `make api/ssh` opens a shell on the server.

4. **Install what it needs**, on the server (`make api/ssh`):

   ```bash
   apt update && apt upgrade -y
   apt install -y make caddy
   curl -fsSL https://get.docker.com | sh
   ```

   The API and the database publish their ports on `127.0.0.1` only, so the
   firewall's three ports are all the outside reaches.

5. **Give it a deploy key.** Each server reads the repository with a key of its
   own, read-only, so a lost server is one key to revoke:

   ```bash
   ssh-keygen -t ed25519 -N '' -f ~/.ssh/id_ed25519
   cat ~/.ssh/id_ed25519.pub
   ```

   Add what it prints in
   [the repository's deploy keys](https://github.com/mpont91/unagistart/settings/keys),
   without write access.

6. **Clone the repository**, in root's home (the first time, `yes` to GitHub's
   fingerprint):

   ```bash
   git clone git@github.com:mpont91/unagistart.git
   ```

7. **Write `apps/api/.env`** from the example:

   ```bash
   cd unagistart/apps/api
   cp .env.example .env && chmod 600 .env
   ```

   and change, from the development values:
   - `NODE_ENV=production`.
   - `CORS_ORIGINS` and `FRONTEND_URL`: `https://unagistart.mpont91.com`.
   - `POSTGRES_PASSWORD`: a new one (`openssl rand -hex 32`), and the same in
     `DATABASE_URL`.
   - `JWT_SECRET`: a new one (`openssl rand -hex 32`), never the development
     one.
   - `RESEND_API_KEY`, `GOOGLE_CLIENT_ID`, `SENTRY_DSN`: the real ones.
   - `COMPOSE_PROFILES=backup` and the three `BACKUP_*` keys.
   - `PORT` and `POSTGRES_PORT`: the defaults, unless another project on the
     same VPS already uses them.
   - `SERVER_SSH` and `SERVER_PATH`: empty; they're for your machine.

   `COMPOSE_PROJECT_NAME` stays `unagistart`, and never changes afterwards: it
   names the database volume.

8. **Put Caddy in front of the API.** It gets and renews the certificate by
   itself:

   ```bash
   cat > /etc/caddy/Caddyfile <<'CADDY'
   api.unagistart.mpont91.com {
   	reverse_proxy 127.0.0.1:3000
   }
   CADDY
   systemctl reload caddy
   ```

   The port is the `PORT` in `.env`. A VPS shared by several projects keeps one
   Caddyfile with a block per project. Nothing else may sit in front: the API
   trusts exactly one proxy hop, and its rate limits rely on it.

**The first deploy**, from your machine:

9. Deploy, and check the API answers:

   ```bash
   make deploy    # pull, migrate, build and start
   curl https://api.unagistart.mpont91.com/uptime    # {"data":…}
   ```

10. **Check the backups**, on the server (`make api/ssh`):

    ```bash
    make api/backup    # prints "backup: uploaded daily/…", now in the bucket
    ```

**The web:**

11. In Vercel, **import the repository** with `apps/web` as root directory, set
    `PUBLIC_API_URL=https://api.unagistart.mpont91.com` and `PUBLIC_SENTRY_DSN`,
    deploy, and add `unagistart.mpont91.com` under the project's _Domains_.

**Check it end to end:**

12. On `https://unagistart.mpont91.com`, sign up with email, confirm the address
    from the email, log in, and sign in with Google.
13. Make yourself admin, on the server (`make api/ssh`):
    `make api/grant-admin EMAIL=you@…`.
14. UptimeRobot: a monitor on `https://unagistart.mpont91.com` and one on
    `https://api.unagistart.mpont91.com/uptime`.
15. A restore drill, on your machine: `make api/restore`, then compare its
    counts with the admin panel's.

Every later deploy is `make deploy` for the API and a push for the web. Deploy
the API first when the contract changes (see `apps/web/CLAUDE.md`).

## Keeping the template alive

Projects started from here drift, and that's fine: each is its own product. What
stays shared is the generic part: tooling, auth, email, monitoring, deploy,
backups and the conventions. When one of them improves in a project (a bug fixed
in the auth flow, a better deploy step, a new rule in a `CLAUDE.md`), bring it
back here too, so the next project starts from the better version. Each
project's root `CLAUDE.md` asks Claude to point those changes out.

A decision that's only useful to some products (background jobs, money, user
secrets, charts) goes under "Patterns" in `docs/ARCHITECTURE.md` rather than
into the code.
