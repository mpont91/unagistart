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
- `GOOGLE_CLIENT_ID`: from Google Cloud (see "Services"), also as
  `PUBLIC_GOOGLE_CLIENT_ID` in `apps/web/.env`.

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

The providers the owner's projects use, each free at a small product's scale,
set up once per project, in their consoles. Any other works: email, Google
sign-in and error reporting sit behind a port in the API. Written with this
project's values, like "Deploy"; the VPS, the web's Vercel project and
UptimeRobot are set up there, since they need the rest running.

### Domain: DonDominio and Vercel

The domain is bought at DonDominio and its DNS lives in Vercel, so every record
is a `vercel dns add`. Once per domain; a project on a subdomain of one already
set up skips it.

1. In [Vercel's domains](https://vercel.com/dashboard/domains), add
   `mpont91.com`. It lists its nameservers.
2. In [DonDominio](https://www.dondominio.com/), the domain's DNS servers →
   custom, with Vercel's.

### Email: Resend

1. In [Resend's domains](https://resend.com/domains), add
   `unagistart.mpont91.com`, in the EU region: the API sends from
   `noreply@unagistart.mpont91.com`.
2. Add every record it lists in Vercel's DNS for `mpont91.com`, then **Verify
   DNS records**.
3. [API keys](https://resend.com/api-keys) → create one with _Sending access_,
   restricted to that domain → `RESEND_API_KEY`.

### Google sign-in: Google Cloud

1. [Create a project](https://console.cloud.google.com/projectcreate),
   `unagistart`.
2. In [Google Auth Platform](https://console.cloud.google.com/auth/overview),
   **Get started**: the app's name, a support email, audience _External_, a
   contact email.
3. **Audience** → **Publish app**, so anyone can sign in, not only test users.
   It asks only for the email and the profile, so Google doesn't review it.
4. **Clients** → **Create client**, _Web application_, with
   `https://unagistart.mpont91.com` and `http://localhost:4321` as _Authorized
   JavaScript origins_ and no redirect URI.
5. Its client ID → `GOOGLE_CLIENT_ID` in the API's `.env`, and
   `PUBLIC_GOOGLE_CLIENT_ID` in the web's (and in Vercel).

### Errors: Sentry

1. Sign up at [Sentry](https://sentry.io/) with the data stored in the EU (it's
   chosen with the organisation, once).
2. A project for the API (platform _Express_), `unagistart-api` → its DSN (under
   _Client Keys_) → `SENTRY_DSN` in the API's `.env`.
3. A project for the web (platform _Astro_), `unagistart-web` → its DSN →
   `PUBLIC_SENTRY_DSN` in Vercel.

### Backups: Backblaze B2 and age

1. Sign up at [Backblaze](https://www.backblaze.com/sign-up/cloud-storage) with
   the region _EU Central_ (it's chosen with the account, once).
2. [Create a bucket](https://secure.backblaze.com/b2_buckets.htm),
   `unagistart-backups`, private, with Object Lock off.
3. Its **Lifecycle Settings** → custom rules: prefix `daily/`, hidden 7 days
   after upload; prefix `weekly/`, hidden after 28; both deleted 1 day after
   hidden.
4. [Application keys](https://secure.backblaze.com/app_keys.htm) → a new one,
   access to that bucket only, _Read and Write_ → its keyID →
   `BACKUP_B2_KEY_ID`, its applicationKey (shown once) →
   `BACKUP_B2_APPLICATION_KEY`, in the server's `.env` and yours (the restore
   drill reads them).
5. The key the backups are encrypted to, on your machine, through a throwaway
   container so `age` needn't be installed:

   ```bash
   docker run --rm alpine sh -c 'apk add -q age && age-keygen'
   ```

   It prints the key pair and writes no file. Save all of it in
   [Bitwarden](https://vault.bitwarden.com/): the `AGE-SECRET-KEY-1…` line is
   what `make api/restore` asks for, and it's never on the server. The public
   key (`age1…`) → `BACKUP_AGE_RECIPIENT`.

## Deploy

The first deploy, from zero, once the services above are set up. Written with
this project's values: the web at `unagistart.mpont91.com`, the API at
`api.unagistart.mpont91.com`, the repository `mpont91/unagistart`; a project
changes them for its own. `<ip>` is the server's address, used only for the DNS:
everything else reaches the server by its name.

**The server** needs Docker (with Compose), git, `make` and Caddy, the reverse
proxy, and nothing else: everything the project runs there runs in a container.

1. **Create the VPS** on Clouding: Ubuntu, latest LTS.
2. **Point the API's name at it:**
   `vercel dns add mpont91.com api.unagistart A <ip>`.
3. **Install what it needs**, on the server
   (`ssh root@api.unagistart.mpont91.com`):

   ```bash
   apt update && apt upgrade -y
   apt install -y make caddy
   curl -fsSL https://get.docker.com | sh
   ```

4. **Give it a deploy key.** Each project on each server reads its repository
   with a key of its own, read-only, named after the repository: GitHub takes a
   key for one repository only, and a server may host several projects.

   ```bash
   ssh-keygen -t ed25519 -N '' -f ~/.ssh/unagistart
   cat ~/.ssh/unagistart.pub
   ```

   Add what it prints in
   [the repository's deploy keys](https://github.com/mpont91/unagistart/settings/keys),
   without write access.

5. **Clone the repository** with that key, in root's home (the first time, `yes`
   to GitHub's fingerprint):

   ```bash
   git clone git@github.com:mpont91/unagistart.git \
     -c core.sshCommand='ssh -i ~/.ssh/unagistart -o IdentitiesOnly=yes'
   ```

   `-c` saves the key in the clone's own config, so every later `git pull` uses
   it, and the other projects' keys never get in the way.

6. **Write `apps/api/.env`** from the example:

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
   - `RESEND_API_KEY`: from [Resend](#email-resend).
   - `GOOGLE_CLIENT_ID`: from [Google Cloud](#google-sign-in-google-cloud).
   - `SENTRY_DSN`: the API project's, from [Sentry](#errors-sentry).
   - `COMPOSE_PROFILES=backup`, which turns the nightly backup on: it runs only
     on the server, so in development it stays empty.
   - `BACKUP_B2_KEY_ID`, `BACKUP_B2_APPLICATION_KEY` and `BACKUP_AGE_RECIPIENT`:
     from [Backblaze B2 and age](#backups-backblaze-b2-and-age).
   - `PORT` and `POSTGRES_PORT`: the defaults, unless another project on the
     same VPS already uses them.
   - `SERVER_SSH` and `SERVER_PATH`: empty; they're for your machine.

   `COMPOSE_PROJECT_NAME` stays `unagistart`, and never changes afterwards: it
   names the database volume.

7. **Put Caddy in front of the API.** It gets and renews the certificate by
   itself:

   ```bash
   cat >> /etc/caddy/Caddyfile <<'CADDY'
   api.unagistart.mpont91.com {
   	reverse_proxy 127.0.0.1:3000
   }
   CADDY
   systemctl reload caddy
   ```

**The first deploy**, from your machine:

8. **Tell your machine where it is.** In your local `apps/api/.env`:

   ```bash
   SERVER_SSH=root@api.unagistart.mpont91.com
   SERVER_PATH=/root/unagistart
   ```

   From then on, `make api/ssh` opens a shell in the server's clone, and
   `make deploy` deploys there.

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
    `PUBLIC_API_URL=https://api.unagistart.mpont91.com`, `PUBLIC_SENTRY_DSN` and
    `PUBLIC_GOOGLE_CLIENT_ID`, deploy, and add `unagistart.mpont91.com` under
    the project's _Domains_.

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
