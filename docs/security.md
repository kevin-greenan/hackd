# Security Notes

This document tracks the current security posture.

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
- Admin user, group, module, challenge, attachment, assignment, and reporting actions require the server-side `requireAdmin()` helper.
- Attachment downloads require an active user and verify admin role or learner assignment before returning file bytes.
- Client-side role checks are treated as presentation only; server-side helpers are the access-control boundary.

## Admin Audit Logging

- Admin user, group, module, challenge, attachment, and assignment create/update/delete actions write `AuditLog` records.
- Admin audit-log reads require the same server-side admin authorization boundary as other admin pages.
- Admin report pages and CSV exports require the same server-side admin authorization boundary as other admin pages.
- User creation audit metadata excludes plaintext passwords and password hashes.
- Group deletion is allowed only for groups without members and assignments.
- Admins cannot disable their own active session account through the user update form.

## Seed Accounts

- The seed script creates or updates one admin and one learner from environment variables.
- Re-running the seed is idempotent.
- Seed passwords are never printed.
- Default Docker Compose credentials are for local development only.

## Rate Limiting

- Login attempts use an in-memory limiter keyed by forwarded IP.
- This is suitable for the local foundation only.
- Production deployments should move rate limiting to durable infrastructure such as Redis or an edge layer.

## File Attachments

- Attachment uploads enforce a default 5 MB size limit through `MAX_ATTACHMENT_BYTES`.
- Attachment uploads allow only a narrow set of document, source, log, archive, and text-like file extensions.
- Attachment filenames are normalized with `path.basename()` and rejected when they contain path traversal.
- Download responses set `X-Content-Type-Options: nosniff`.
- Local storage is intended for v1 development and single-node deployments; production deployments should use durable storage with backups.

## Dependency Audit

As of this pass:

- `npm audit --omit=dev` reports zero vulnerabilities.
- `npm audit` reports zero vulnerabilities.
- `postcss` is pinned through npm `overrides` so nested dependencies use the patched line.

## Known Security Limitations

- No CSRF-specific token layer is implemented yet; current auth mutations are narrow form posts with same-site cookies.
- No MFA, OIDC, SAML, or SCIM support exists yet.
- No challenge runtime exists yet, so sandbox isolation controls are not implemented in code.
