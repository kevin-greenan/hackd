# Security Notes

This document tracks the current Milestone 0 and Milestone 1 security posture.

## Authentication

- hackd uses local email/password authentication for the first implementation pass.
- Passwords are hashed with bcrypt before storage.
- Disabled users cannot log in.
- Successful login creates a signed HTTP-only cookie.
- `SESSION_SECRET` must be at least 32 characters and must not be committed.

## Authorization

- Protected pages call server-side helpers before rendering.
- `/dashboard` requires an authenticated active user.
- `/admin` requires an authenticated active user with the `ADMIN` role.
- Client-side role checks are treated as presentation only; server-side helpers are the access-control boundary.

## Seed Accounts

- The seed script creates or updates one admin and one learner from environment variables.
- Re-running the seed is idempotent.
- Seed passwords are never printed.
- Default Docker Compose credentials are for local development only.

## Rate Limiting

- Login attempts use an in-memory limiter keyed by forwarded IP.
- This is suitable for the local foundation only.
- Production deployments should move rate limiting to durable infrastructure such as Redis or an edge layer.

## Dependency Audit

As of this pass:

- `npm audit --omit=dev` reports zero vulnerabilities.
- `npm audit` reports zero vulnerabilities.
- `postcss` is pinned through npm `overrides` so nested dependencies use the patched line.

## Known Security Limitations

- No CSRF-specific token layer is implemented yet; current auth mutations are narrow form posts with same-site cookies.
- No MFA, OIDC, SAML, or SCIM support exists yet.
- No admin audit-log writes are wired to UI actions yet.
- No challenge runtime exists yet, so sandbox isolation controls are not implemented in code.
