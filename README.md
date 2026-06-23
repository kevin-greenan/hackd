# hackd

hackd is a containerized control plane for hands-on security training modules, challenges, sandboxes, validation, and learner progress.

This repository currently implements Milestone 0 through Milestone 7 foundations: a Next.js TypeScript app, Postgres, Prisma, local email/password authentication, signed cookie sessions, server-side RBAC, seeded admin and learner access, seeded core training data, basic learner/admin dashboards, admin list views, basic user/group/content/assignment management, admin audit visibility, progress reporting with CSV exports, module detail pages, Markdown lesson rendering, static flag, exact-text, and multiple-choice challenge submissions, challenge file attachments and downloads, Dockerized web challenge launch/stop flows, recent attempt visibility for admins, and health endpoints.

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
- `FILE_STORAGE_DIR`
- `MAX_ATTACHMENT_BYTES`
- `RUNTIME_RUNNER_URL`
- `CHALLENGE_PUBLIC_HOST`

Do not commit real secrets. `SESSION_SECRET` must be at least 32 characters.
`FILE_STORAGE_DIR` stores admin-uploaded challenge attachments and should point to durable local storage or a mounted volume.
`RUNTIME_RUNNER_URL` is the internal Docker runner service URL. `CHALLENGE_PUBLIC_HOST` is the browser-visible host used when formatting mapped challenge URLs.

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

[Learner experience notes](docs/learner-experience.md) describe the current `/dashboard` to `/modules/[slug]` flow.

## Manual Smoke Test

After `docker compose up --build`:

1. Open [http://localhost:3000](http://localhost:3000).
2. Sign in as `admin@hackd.local`.
3. Confirm `/dashboard` shows the admin identity and an `Open admin` action.
4. Open `/admin` and confirm the admin dashboard loads with metric cards and recent attempts.
5. Open the admin Users, Groups, Modules, Challenges, Assignments, Instances, Reports, and Audit links and confirm each view renders.
6. Create a test group from `/admin/groups`, then update it and delete it before adding members or assignments.
7. Create a test learner from `/admin/users`, assign it to a group, then disable it.
8. Create a draft module from `/admin/modules`, update it, and link an existing challenge.
9. Create a draft challenge from `/admin/challenges`, then update its metadata.
10. Upload and delete a small `.txt` attachment from an admin challenge row.
11. Create, update, and delete a test assignment from `/admin/assignments`.
12. Open `/admin/reports` and confirm learner progress, module progress, challenge performance, and CSV export links render.
13. Log out.
14. Sign in as `learner@hackd.local`.
15. Confirm `/dashboard` loads for the learner.
16. Open an assigned module and confirm Markdown content plus challenge sections render.
17. Confirm challenge attachments render as download links when files are attached.
18. Submit an incorrect challenge answer and confirm the attempt feedback appears.
19. Submit the seeded correct static flag `flag{sample}` and confirm progress updates.
20. Launch the sample Dockerized web challenge, open the generated URL, then stop the instance.
21. Open the secure code review module and confirm the optional multiple-choice challenge renders with selectable answers.
22. Open `/admin` and confirm the learner is redirected back to `/dashboard?error=unauthorized`.
23. Log out and confirm `/dashboard` redirects to `/login`.

## Implemented

- Next.js App Router with TypeScript and Tailwind CSS
- Postgres via Docker Compose with persistent named volume
- Prisma schema and initial migration for the roadmap entities
- Idempotent admin, learner, group, module, challenge, assignment, completion, and attempt seed data
- Local login/logout flow
- Signed HTTP-only session cookie
- Server-side `getCurrentUser()`, `requireUser()`, and `requireAdmin()` helpers
- Basic admin and learner route separation with database-backed dashboard data
- Admin lists for users, groups, modules, challenges, and assignments
- Admin create/edit workflows for users and groups with audit logging
- Admin create/edit workflows for modules and challenges, plus challenge association
- Admin create/edit/delete workflows for assignments with audit logging
- Admin audit log visibility for user, group, module, challenge, and assignment changes
- Admin progress reports for learners, modules, challenge performance, and CSV exports
- Admin challenge attachment upload/delete workflows with local file storage
- Learner challenge attachment downloads for assigned modules
- Internal Docker runtime runner service for sample Dockerized web challenges
- Learner launch/stop controls and admin instance visibility for Dockerized challenge instances
- Learner module detail pages with Markdown lesson rendering and challenge status sections
- Static flag, exact-text short-answer, and multiple-choice validation with attempt recording
- Admin recent-attempt visibility for learner submissions
- Landing, login, dashboard, and admin pages
- `/api/healthz` endpoint with database connectivity check
- Vitest coverage for password hashing and RBAC helpers
- GitHub Actions workflow for install, Prisma generate, lint, test, and build
- Dependency lockfile and clean `npm audit` result
- Docker Compose smoke-test script

## Known Limitations

- Password reset and hard user deletion are not implemented yet.
- Reporting filters and scheduled reports are not implemented yet.
- Rich type-specific challenge config editors are not implemented yet; validation/runtime config is edited as JSON.
- File-based answer submissions are not implemented yet.
- Docker runtime hardening beyond local V1 limits is not implemented yet.
- Content import, OIDC/SAML, multi-tenancy, and marketplace concepts are deferred.
- Auth rate limiting is in-memory and suitable only for local/dev foundations.
- CSRF-specific token handling is not implemented yet.

## Next Milestone Checklist

Next milestones should expand admin management and challenge coverage:

- Reporting filters and richer exports
- Assignment lifecycle refinements, including completion reconciliation after assignment deletion
- Content import
