# Architecture

hackd is a single full-stack Next.js application backed by Postgres through Prisma. Docker Compose runs the web app, database, and an internal runtime runner used for Dockerized challenges.

## Runtime Components

- `web`: Next.js App Router application with server-rendered pages, server actions, and route handlers.
- `db`: Postgres database with a persistent Docker volume.
- `runner`: Internal service that owns Docker socket access for challenge runtime lifecycle operations.
- `prisma`: Schema, migrations, generated client, and seed script.

The `web` service does not mount the Docker socket. It calls the runner through `RUNTIME_RUNNER_URL`.

## Request Boundaries

- Authentication uses local email/password credentials.
- Successful login creates a signed HTTP-only cookie.
- Server components and server actions call `requireUser()` or `requireAdmin()` before rendering or mutating protected resources.
- Client-side checks are presentation only; server-side helpers are the authorization boundary.

## Core Data Layer

Server-side application logic lives under `lib/core/`:

- `assignments.ts` enforces user-or-group assignment targeting and wraps assignment creation.
- `learner-dashboard.ts` resolves direct and group assignments for the current learner.
- `module-detail.ts` resolves assigned learner modules, Markdown bodies, linked challenges, progress, attempts, attachments, and active runtime instances.
- `challenge-validation.ts` validates supported challenge submissions without leaking expected answers.
- `challenge-submissions.ts` records attempts and updates module completion.
- `challenge-attachments.ts` validates uploads, stores local challenge files, enforces attachment download access, and cleans up deleted files.
- `challenge-runtime.ts` validates Docker web runtime definitions, calls the internal runner service, and stores instance lifecycle state.
- `admin-metrics.ts` collects counts and recent learner attempts for the admin dashboard.
- `admin-lists.ts` powers admin list views.
- `admin-management.ts` validates admin mutations, manages module-challenge associations, reconciles assignment completion lifecycle, and writes audit records.
- `admin-reports.ts` powers filtered progress reporting and CSV exports.
- `content-import.ts` validates YAML/JSON content bundles, imports Markdown lesson bodies, and upserts modules, challenges, and module links.
- `audit-log.ts` centralizes admin action audit writes and bounded audit-log reads.
- `completions.ts` calculates progress summaries without coupling UI code to completion math.
- `logger.ts` writes single-line JSON events for operational visibility.

## Error Handling

Next.js error boundaries in `app/error.tsx` and `app/global-error.tsx` render controlled retry pages for route-level and application-shell failures. Expected operational failures, such as database health-check failures, are logged with structured JSON before returning bounded responses.

## Deferred Areas

The current architecture is intentionally local-first. Production-grade multi-tenancy, advanced runtime isolation, durable rate limiting, federated identity, scheduled report delivery, and marketplace concepts remain future work.
