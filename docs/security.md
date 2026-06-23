# Security Notes

This document summarizes the current security posture for local and single-host internal testing.

## Authentication

- hackd uses local email/password authentication.
- Passwords are hashed with bcrypt before storage.
- Disabled users cannot log in.
- Successful login creates a signed HTTP-only cookie.
- `SESSION_SECRET` must be at least 32 characters and must not be committed.

## Authorization

- Protected pages call server-side helpers before rendering.
- `/dashboard` requires an authenticated active user.
- `/admin` requires an authenticated active user with the `ADMIN` role.
- Admin user, group, module, challenge, attachment, assignment, instance, report, and audit actions require `requireAdmin()`.
- Attachment downloads require an active user and verify admin role or learner assignment before returning file bytes.
- Dockerized challenge launch and stop actions require an active learner assignment or admin runtime management access.
- Client-side role checks are presentation only; server-side helpers are the access-control boundary.

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
- Local storage is intended for development and single-node deployments; production deployments should use durable storage with backups.

## Docker Runtime

- The web service does not mount the Docker socket.
- Docker socket access is isolated to the internal `runner` service in Docker Compose.
- Runtime containers are created without privileged mode.
- Runtime containers drop all Linux capabilities, set `no-new-privileges`, set a read-only root filesystem, and apply memory, CPU, and PID limits.
- Runtime containers avoid host filesystem mounts.
- Runtime containers are labeled with `hackd.runtime=true` and tracked in `ChallengeInstance`.
- Expired instances can be cleaned from `/admin/instances`; cleanup marks database state and stops/removes the Docker container.
- This is a local V1 runner and should be further hardened before exposing hostile workloads beyond a trusted development host.

## Dependency and Container Scanning

- `npm run security:check` runs `npm audit --omit=dev` and scans tracked source files for common secret patterns.
- `npm run container:scan` runs Trivy against the local `hackd-web:latest` and `hackd-runner:latest` images.
- The runtime image removes global `npm`/`npx` and development-only packages after build.
- `postcss` is pinned through npm `overrides` so nested dependencies use the patched line.

## CI Security Baseline

- CI runs lint, tests, security checks, and production build checks.
- CI runs Playwright UI smoke tests against Docker Compose.
- CI runs local Trivy container scanning after images are built.
- These checks avoid paid GitHub Advanced Security features while still providing useful automated guardrails.

## Error Handling and Logging

- App routes can write single-line JSON logs through `logger`.
- Log entries include `level`, `event`, and `timestamp`.
- Login success, failed login paths, rate limits, and health-check failures emit structured events without logging passwords or session tokens.
- App-level and global error boundaries render controlled retry pages and log client-side error events.

## Known Security Limitations

- No CSRF-specific token layer is implemented yet; current auth mutations are narrow form posts with same-site cookies.
- No MFA, OIDC, SAML, or SCIM support exists yet.
- Runtime isolation is a local Docker V1 implementation and does not yet include egress controls, image signing, rootless Docker, gVisor, or Firecracker.
