# hackd Architecture Notes

This first implementation pass uses a single full-stack Next.js application backed by Postgres through Prisma.

## Current Components

- `web`: Next.js App Router application with server-rendered pages and route handlers.
- `db`: Postgres database managed locally by Docker Compose.
- `prisma`: ORM schema, migration, generated client, and seed script.

## Auth Boundary

Authentication is local email/password for v1. Successful login creates a signed HTTP-only cookie. Server components call `requireUser()` and `requireAdmin()` before rendering protected routes.

## Deferred Components

Challenge runtime, workers, content import, authoring, assignments, and reporting are intentionally deferred beyond Milestone 1. Their database models are present to keep the foundation aligned with the roadmap.
