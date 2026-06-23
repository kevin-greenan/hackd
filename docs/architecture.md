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
- `admin-metrics.ts` collects basic counts for the admin dashboard.
- `completions.ts` calculates progress summaries without coupling UI code to completion math.
