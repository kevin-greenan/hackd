# hackd Architecture Notes

hackd uses a single full-stack Next.js application backed by Postgres through Prisma.

## Current Components

- `web`: Next.js App Router application with server-rendered pages and route handlers.
- `db`: Postgres database managed locally by Docker Compose.
- `prisma`: ORM schema, migration, generated client, and seed script.

## Auth Boundary

Authentication is local email/password for v1. Successful login creates a signed HTTP-only cookie. Server components call `requireUser()` and `requireAdmin()` before rendering protected routes.

## Deferred Components

Challenge runtime, workers, content import, authoring, full admin CRUD, and reporting exports are intentionally deferred. Their database models are present to keep the foundation aligned with the roadmap.

## Core Data Layer

Milestone 2 adds small server-side helpers under `lib/core/`:

- `assignments.ts` enforces user-or-group assignment targeting and wraps assignment creation.
- `learner-dashboard.ts` resolves direct and group assignments for the current learner.
- `module-detail.ts` resolves an assigned learner module, Markdown body, linked challenges, and challenge completion state.
- `challenge-validation.ts` validates supported challenge submissions without leaking expected answers.
- `challenge-submissions.ts` records attempts and updates module completion.
- `admin-metrics.ts` collects basic counts and recent learner attempts for the admin dashboard.
- `completions.ts` calculates progress summaries without coupling UI code to completion math.
