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
| Tests      | `node:test` everywhere; API integration tests against a real Postgres, external services faked.                       |
| Deploy     | Docker Compose on a VPS (`make deploy`), migrations from a throwaway container; the web on Vercel.                    |
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

- [ ] `packages/shared/src/brand.ts`: `APP_NAME`, `APP_DOMAIN`, `APP_SLUG`.
- [ ] The product's description at the top of the three `CLAUDE.md` files (they
      describe Unagi Start), and its security rules in the root one.
- [ ] `docs/VISION.md`, then `docs/ROADMAP.md` and the first spec, from the
      blank ones in `docs/templates/` (the ones in `docs/` are Unagi Start's):
      delete `docs/specs/` and copy the skeletons over. Write them before any
      code: they're what Claude checks every decision against.
- [ ] The palette in `apps/web/src/styles/global.css` (and the same colours in
      `apps/api/src/infrastructure/email/email-layout.ts`).
- [ ] The logo: `apps/web/src/assets/logo.svg`, `apps/web/public/favicon.svg`,
      and `apps/web/public/apple-touch-icon.png` (180×180, used by the emails).
- [ ] The landing copy (`home.*` in `apps/web/src/i18n/en.ts` and `es.ts`) and
      `AppHome.vue`, the first screen after logging in.
- [ ] `apps/web/src/constants.ts`: `CONTACT_EMAIL`, the address the contact page
      shows, and `REPOSITORY_URL`, the code the landing links to (empty it if
      the code isn't public).
- [ ] The legal pages in `apps/web/src/legal/`, filled in for Unagi Start: the
      product's name, the controller, the contact and what the product stores,
      as the comment at the top of each says. Have them reviewed before real
      users arrive.
- [ ] Remove from this README what's about the template, and describe the
      product instead.

### 3. Run it locally

Needs Node 26 (`nvm use`), Docker and `make`.

```bash
cp apps/api/.env.example apps/api/.env   # set COMPOSE_PROJECT_NAME, JWT_SECRET
cp apps/web/.env.example apps/web/.env
make install
make dev        # API on :3000 with its database, web on :4321
make check      # the gate: format, lint, typecheck, tests
```

`JWT_SECRET` is `openssl rand -hex 32`. `RESEND_API_KEY` and `GOOGLE_CLIENT_ID`
must be set for the API to boot; any value works locally until the real ones
exist (sign-up then reports the unsent email instead of sending it). To log in
before email works, confirm the account by hand:

```bash
(cd apps/api && docker compose exec db psql -U app -d app \
  -c "UPDATE \"User\" SET \"emailVerifiedAt\" = now() WHERE email = 'you@…'")
make api/grant-admin EMAIL=you@…   # optional: open the admin panel
```

If another project already uses a port, change it in that app's `.env` (see
"Ports and local config" in `CLAUDE.md`).

### 4. Accounts the product needs

Each one is free at a small product's scale. They can come in any order. Each
name links to its console; the providers named are the ones the owner's projects
use, so one account serves them all.

- [ ] **Domain,** bought on [IONOS](https://my.ionos.es/), its nameservers
      pointed at [Vercel](https://vercel.com/dashboard/domains), which holds the
      DNS (see "Hosting and deploy" in `docs/ARCHITECTURE.md`).
- [ ] **A VPS** on [Clouding.io](https://portal.clouding.io/) (see "5. Deploy",
      below).
- [ ] **[Resend](https://resend.com/emails):** verify the domain, create an API
      key → `RESEND_API_KEY`.
- [ ] **[Google Cloud](https://console.cloud.google.com/apis/credentials):** an
      OAuth client of type "Web application", with the production origin and
      `http://localhost:4321` as authorised JavaScript origins →
      `GOOGLE_CLIENT_ID` in `apps/api/.env` and in `apps/web/src/constants.ts`.
- [ ] **[Sentry](https://sentry.io/)** (EU region): one project for the API →
      `SENTRY_DSN`, one for the web → `PUBLIC_SENTRY_DSN`.
- [ ] **[Backblaze B2](https://secure.backblaze.com/b2_buckets.htm)** (EU
      region): a private bucket, an application key with _Read and Write_ access
      restricted to it → `BACKUP_B2_KEY_ID`, `BACKUP_B2_APPLICATION_KEY`.
      Lifecycle rules in the B2 console: `daily/` hides files after 7 days,
      `weekly/` after 28, both delete a day after hiding.
- [ ] **An age key pair** for the backups: `age-keygen`. The public key
      (`age1…`) → `BACKUP_AGE_RECIPIENT`; the private key goes only into the
      password manager, [Bitwarden](https://vault.bitwarden.com/), never onto
      the server.
- [ ] **[Vercel](https://vercel.com/dashboard):** an account; it hosts the web
      and the DNS (see "5. Deploy").
- [ ] **[UptimeRobot](https://dashboard.uptimerobot.com/)**, a monitor on the
      web and on the API's `/uptime`.

Then list them all in the project's README, under "Services it uses": a table
with each service (linked to its console), what it's for and where its key goes,
so nobody has to remember where anything lives.

### 5. Deploy

The first deploy, from zero, once the accounts above exist. `<domain>` is the
product's domain, `<ip>` the server's address and `<name>` the repository's
name.

**The server** needs Docker (with Compose), git, `make` and Caddy, the reverse
proxy, and nothing else: everything the project runs there runs in a container.

1. **Create the VPS** on Clouding: Ubuntu, latest LTS, with your SSH public key.
   In its firewall, open only ports 22, 80 and 443.
2. **Point the API's name at it.** In Vercel's DNS for `<domain>`, an `A` record
   `api` → `<ip>` (or `vercel dns add <domain> api A <ip>`). Wait until
   `dig +short api.<domain>` prints `<ip>`: Caddy can't get a certificate
   before.
3. **Install what it needs.** On the server, as root:

   ```bash
   ssh root@<ip>
   apt update && apt upgrade -y
   apt install -y make caddy
   curl -fsSL https://get.docker.com | sh
   sshd -T | grep passwordauthentication   # must print "no"
   ```

   The API and the database publish their ports on `127.0.0.1` only, so the
   firewall's three ports are all the outside reaches.

4. **Clone the repository** at the path that will be `SERVER_PATH`:

   ```bash
   git clone https://github.com/<owner>/<name>.git /srv/<name>
   ```

   A private repository needs a deploy key instead: `ssh-keygen -t ed25519` on
   the server, the public key added read-only under the repository's _Settings →
   Deploy keys_, and the clone made with `git@github.com:…`.

5. **Write `apps/api/.env`** from the example:

   ```bash
   cd /srv/<name>/apps/api
   cp .env.example .env && chmod 600 .env
   ```

   and change, from the development values:
   - `NODE_ENV=production`.
   - `COMPOSE_PROJECT_NAME`: the product's slug. Never changed afterwards: it
     names the database volume.
   - `CORS_ORIGINS` and `FRONTEND_URL`: `https://<domain>`.
   - `POSTGRES_PASSWORD`: a new one (`openssl rand -hex 32`), and the same in
     `DATABASE_URL`.
   - `JWT_SECRET`: a new one (`openssl rand -hex 32`), never the development
     one.
   - `RESEND_API_KEY`, `GOOGLE_CLIENT_ID`, `SENTRY_DSN`: the real ones.
   - `COMPOSE_PROFILES=backup` and the three `BACKUP_*` keys.
   - `PORT` and `POSTGRES_PORT`: the defaults, unless another project on the
     same VPS already uses them.
   - `SERVER_SSH` and `SERVER_PATH`: empty; they're for your machine.

6. **Put Caddy in front of the API.** It gets and renews the certificate by
   itself:

   ```bash
   cat > /etc/caddy/Caddyfile <<'CADDY'
   api.<domain> {
   	reverse_proxy 127.0.0.1:3000
   }
   CADDY
   systemctl reload caddy
   ```

   The port is the `PORT` in `.env`. A VPS shared by several projects keeps one
   Caddyfile with a block per project. Nothing else may sit in front: the API
   trusts exactly one proxy hop, and its rate limits rely on it.

**The first deploy**, from your machine:

7. In your local `apps/api/.env`, `SERVER_SSH=root@<ip>` and
   `SERVER_PATH=/srv/<name>`. Then:

   ```bash
   make deploy                          # pull, migrate, build and start
   curl https://api.<domain>/uptime     # {"data":…}
   ```

8. **Check the backups**, on the server:

   ```bash
   make api/ssh
   make api/backup    # prints "backup: uploaded daily/…", now in the bucket
   ```

**The web:**

9. In Vercel, **import the repository** with `apps/web` as root directory, set
   `PUBLIC_API_URL=https://api.<domain>` and `PUBLIC_SENTRY_DSN`, deploy, and
   add `<domain>` under the project's _Domains_.

**Check it end to end:**

10. On `https://<domain>`, sign up with email, confirm the address from the
    email, log in, and sign in with Google.
11. Make yourself admin, on the server (`make api/ssh`):
    `make api/grant-admin EMAIL=you@…`.
12. UptimeRobot: a monitor on `https://<domain>` and one on
    `https://api.<domain>/uptime`.
13. A restore drill, on your machine: `make api/restore`, then compare its
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
