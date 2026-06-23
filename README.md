# hackd

hackd is a containerized training control plane for hands-on security modules. It packages learner assignments, Markdown lessons, challenge validation, Dockerized challenge runtimes, admin workflows, reporting, and local release checks into a single Next.js application backed by Postgres.

The current foundation is designed for local and single-host internal testing. It is not yet a hosted multi-tenant platform.

## Capabilities

- Local email/password authentication with signed HTTP-only sessions
- Server-side role checks for learner and admin routes
- Seeded admin, learner, groups, modules, challenges, assignments, attempts, and completions
- Learner dashboard with direct and group assignments
- Module detail pages with Markdown lessons, challenge progress, attachment downloads, attempt history, and Dockerized runtime controls
- Static flag, exact-text short-answer, and multiple-choice challenge validation
- Admin management for users, groups, modules, challenges, assignments, challenge attachments, and runtime instances
- Type-specific challenge authoring controls that write portable validation/runtime JSON
- Assignment lifecycle cleanup that removes stale completions when assignments change
- Admin reporting for learner progress, module progress, challenge performance, recent attempts, and filtered CSV exports
- Admin audit-log visibility for management actions
- YAML/JSON content import with dry-run validation
- Health checks, structured logs, release checks, UI smoke tests, and local container vulnerability scanning

## Prerequisites

- Docker and Docker Compose
- Node.js 22 and npm for non-container local development

## Configuration

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
- `FILE_STORAGE_DIR`
- `MAX_ATTACHMENT_BYTES`
- `CHALLENGE_SUBMISSION_LIMIT`
- `CHALLENGE_SUBMISSION_WINDOW_SECONDS`
- `RUNTIME_RUNNER_URL`
- `RUNTIME_ALLOWED_IMAGES`
- `CHALLENGE_PUBLIC_HOST`
- `HACKD_BRAND_NAME`
- `HACKD_BRAND_TAGLINE`
- `HACKD_BRAND_LOGO_URL`
- `HACKD_THEME_PRIMARY`

Do not commit real secrets. `SESSION_SECRET` must be at least 32 characters.

`FILE_STORAGE_DIR` stores admin-uploaded challenge attachments and should point to durable local storage or a mounted volume. `RUNTIME_RUNNER_URL` is the internal Docker runner service URL. `RUNTIME_ALLOWED_IMAGES` is a comma-separated allowlist for Dockerized challenge images. `CHALLENGE_PUBLIC_HOST` is the browser-visible host used when formatting mapped challenge URLs.

Branding and theme variables are optional; see [Branding and themes](docs/branding.md).

## Quick Start

Start the full local stack:

```sh
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000).

The web service runs Prisma migrations and seeds local users plus sample content on startup.

Default local admin:

- Email: `admin@hackd.local`
- Password: `change-me-in-development`

Default local learner:

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

Run migrations and seed local data:

```sh
npm run db:migrate
npm run db:seed
```

Start the app:

```sh
npm run dev
```

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server. |
| `npm run build` | Generate Prisma client and build the production app. |
| `npm run lint` | Run ESLint. |
| `npm run test` | Run Vitest unit and core-flow tests. |
| `npm run ui:smoke` | Run Playwright smoke tests against a running app. |
| `npm run security:check` | Run local dependency and secret-pattern checks. |
| `npm run container:scan` | Scan local `hackd-web` and `hackd-runner` images with Trivy. |
| `npm run release:check` | Run lint, tests, security checks, and production build. |
| `npm run smoke:compose` | Build, start, health-check, and stop the Compose stack. |
| `npm run content:import -- --file examples/content/secure-notes.yaml --dry-run` | Validate sample content without writing. |
| `npm run db:migrate` | Apply local Prisma migrations in development. |
| `npm run db:seed` | Seed local users and sample content. |

`npm run smoke:compose` builds the containers, starts the stack, waits for `/api/healthz`, checks the runner, prints health responses, and stops the stack.

## Documentation

- [Architecture](docs/architecture.md)
- [Data model](docs/data-model.md)
- [Security notes](docs/security.md)
- [Admin usage](docs/admin-usage.md)
- [Learner experience](docs/learner-experience.md)
- [Challenge workflows](docs/challenges.md)
- [Content import](docs/content-import.md)
- [Branding and themes](docs/branding.md)
- [Docker deployment](docs/deployment.md)
- [Operations runbook](docs/operations-runbook.md)
- [Release checklist](docs/release.md)
- [V1 release roadmap](docs/v1-roadmap.md)
- [Requirements and roadmap](requirements.md)

## Manual Smoke Test

After `docker compose up --build`:

1. Open [http://localhost:3000](http://localhost:3000).
2. Sign in as `admin@hackd.local`.
3. Confirm `/dashboard` shows the admin identity and an `Open admin` action.
4. Open `/admin` and confirm the admin dashboard loads with metric cards and recent attempts.
5. Open Users, Groups, Modules, Challenges, Assignments, Instances, Reports, and Audit.
6. Create, update, and delete a test group before adding members or assignments.
7. Create a test learner, assign it to a group, then disable it.
8. Create a draft module, update it, and link an existing challenge.
9. Create a draft challenge with type-specific settings, then update its metadata.
10. Upload and delete a small `.txt` attachment from an admin challenge row.
11. Create, update, and delete a test assignment.
12. Open `/admin/reports`, apply filters, and confirm filtered CSV export links render.
13. Sign out, then sign in as `learner@hackd.local`.
14. Confirm `/dashboard` lists assigned modules.
15. Open an assigned module and confirm Markdown content, challenge progress, and challenge sections render.
16. Confirm challenge attachments render as download links when files are attached.
17. Submit an incorrect answer and confirm attempt feedback appears.
18. Submit the seeded correct static flag `flag{sample}` and confirm progress updates.
19. Launch the sample Dockerized web challenge, open the generated URL, then stop the instance.
20. Open the secure code review module and confirm the optional multiple-choice challenge renders with selectable answers.
21. Open `/admin` as the learner and confirm the learner is redirected to `/dashboard?error=unauthorized`.
22. Sign out and confirm `/dashboard` redirects to `/login`.

## Current Limits

- Password reset and hard user deletion are planned.
- Scheduled reports and advanced report delivery are planned.
- File-based answer submissions are planned.
- Docker runtime hardening beyond local V1 limits is planned.
- OIDC/SAML, MFA, SCIM, multi-tenancy, and marketplace concepts are deferred.
- Auth and challenge submission rate limiting are in-memory and suitable only for local development.
- CSRF-specific token handling is implemented for state-changing forms.
- The `v1.0` release remains planned; see the [V1 release roadmap](docs/v1-roadmap.md).
