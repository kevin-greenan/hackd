# hackd

hackd is a containerized control plane for hands-on security training modules, challenges, sandboxes, validation, and learner progress.

This repository currently implements Milestone 0 through Milestone 2 foundations: a Next.js TypeScript app, Postgres, Prisma, local email/password authentication, signed cookie sessions, server-side RBAC, seeded admin and learner access, seeded core training data, basic learner/admin dashboards, and a health endpoint.

## Prerequisites

- Docker and Docker Compose
- Node.js 22 and npm for non-container local development

## Environment

Copy the example environment file and adjust values as needed:

```sh
cp .env.example .env
```

Required variables:

- `DATABASE_URL`
- `APP_URL`
- `SESSION_SECRET`
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`
- `SEED_LEARNER_EMAIL`
- `SEED_LEARNER_PASSWORD`

Do not commit real secrets. `SESSION_SECRET` must be at least 32 characters.

## Run With Docker Compose

```sh
docker compose up --build
```

The app will be available at [http://localhost:3000](http://localhost:3000).

On startup, the web service runs Prisma migrations and seeds local users plus sample core data from the environment variables in `docker-compose.yml`.

Default local admin credentials:

- Email: `admin@hackd.local`
- Password: `change-me-in-development`

Default local learner credentials:

- Email: `learner@hackd.local`
- Password: `change-me-in-development`

Change these before using any shared environment.

## Local Development

Install dependencies:

```sh
npm install
```

Start Postgres:

```sh
docker compose up db
```

Run migrations and seed local users plus sample data:

```sh
npm run db:migrate
npm run db:seed
```

Start the app:

```sh
npm run dev
```

## Commands

```sh
npm run dev
npm run build
npm run lint
npm run test
npm run db:migrate
npm run db:seed
npm run smoke:compose
```

`npm run smoke:compose` builds the containers, starts the stack, waits for `/api/healthz`, prints the health response, and stops the stack.

## Manual Smoke Test

After `docker compose up --build`:

1. Open [http://localhost:3000](http://localhost:3000).
2. Sign in as `admin@hackd.local`.
3. Confirm `/dashboard` shows the admin identity and an `Open admin` action.
4. Open `/admin` and confirm the admin dashboard loads.
5. Log out.
6. Sign in as `learner@hackd.local`.
7. Confirm `/dashboard` loads for the learner.
8. Open `/admin` and confirm the learner is redirected back to `/dashboard?error=unauthorized`.
9. Log out and confirm `/dashboard` redirects to `/login`.

## Implemented

- Next.js App Router with TypeScript and Tailwind CSS
- Postgres via Docker Compose with persistent named volume
- Prisma schema and initial migration for the roadmap entities
- Idempotent admin, learner, group, module, challenge, assignment, completion, and attempt seed data
- Local login/logout flow
- Signed HTTP-only session cookie
- Server-side `getCurrentUser()`, `requireUser()`, and `requireAdmin()` helpers
- Basic admin and learner route separation with database-backed dashboard data
- Landing, login, dashboard, and admin pages
- `/api/healthz` endpoint with database connectivity check
- Vitest coverage for password hashing and RBAC helpers
- GitHub Actions workflow for install, Prisma generate, lint, test, and build
- Dependency lockfile and clean `npm audit` result
- Docker Compose smoke-test script

## Known Limitations

- User creation UI is not implemented yet.
- Full admin CRUD for users, groups, modules, challenges, assignments, and reporting is not implemented yet.
- Dockerized challenge launching is intentionally not implemented in this pass.
- Content import, OIDC/SAML, multi-tenancy, and marketplace concepts are deferred.
- Auth rate limiting is in-memory and suitable only for local/dev foundations.
- CSRF-specific token handling is not implemented yet.

## Next Milestone Checklist

Milestone 3 should turn the data foundation into a richer learner experience:

- Add module detail pages
- Render module Markdown content
- Show challenge sections within modules
- Track challenge completion state within each module
- Add richer empty/loading/error states for assigned module lists
- Keep admin CRUD and audit-log write flows queued for the admin milestone
