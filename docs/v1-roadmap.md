# V1 Release Roadmap

This roadmap defines the path from the current `v0.1.x` internal foundation to a credible `v1.0` release.

The goal for `v1.0` is not to turn hackd into a public SaaS product or a full cyber range. The goal is to make hackd reliable enough for a real internal team to deploy, brand, author content, assign training, run basic challenge labs, audit activity, back up data, and recover from routine failures.

## Release Principle

`v1.0` should be boring, secure, recoverable, documented, and supportable.

New feature work should be evaluated against that principle. If a feature increases operational risk or expands the threat model substantially, it should wait unless it is required for internal production use.

## Scope Boundary

In scope for `v1.0`:

- Single-host or small internal deployment through Docker Compose.
- Local authentication for the internal `v1.0` scope; OIDC/SAML/MFA/SCIM are deferred.
- Admin-managed users, groups, modules, challenges, assignments, reports, audit logs, and branding.
- Stable YAML/JSON content import for modules and challenges.
- Static flag, multiple-choice, short-answer, file-attachment, and simple Dockerized web challenges.
- Operational documentation, backups, restore drills, release checks, and security guardrails.

Out of scope for `v1.0` unless explicitly reprioritized:

- Public SaaS multi-tenancy.
- Billing.
- Marketplace or content-store concepts.
- Kubernetes-native runtime orchestration.
- Full LMS replacement.
- SCORM/xAPI.
- Browser IDE.
- Advanced gamification.
- Production-grade cyber range isolation.
- Malware sandboxing.
- Arbitrary hostile code execution without stronger containment.

## V1 Must-Haves

### 1. Stabilize the Release Baseline

- Keep `README.md`, `REQUIREMENTS.md`, and release docs aligned with the actual tag state.
- Ensure a clean checkout can run the documented setup without hidden local assumptions.
- Verify the standard commands:
  - `npm run lint`
  - `npm run test`
  - `npm run build`
  - `npm run release:check`
  - `npm run smoke:compose`
- Decide whether repository-local agent instructions such as `AGENTS.md` are tracked project files.
- Keep CI green on pull requests and pushes to `main`.

### 2. Production Deployment Guide

- Document a supported single-host deployment model.
- Cover environment variables, TLS/reverse proxy assumptions, persistent volumes, backups, upgrades, restores, and secret rotation.
- Clearly mark local-development defaults that must not be used in shared environments.
- Document the support boundary for Dockerized challenges.

### 3. Security Hardening

- Add CSRF-specific protection for state-changing routes.
- Move login rate limiting out of in-memory process state, likely to Redis or an edge control.
- Move challenge submission throttling out of in-memory process state, likely to Redis or an edge control.
- Revisit static expected answer storage and consider hashing or encrypting static flags.
- Add Docker runtime image allowlisting.
- Improve runner lifecycle reconciliation and scheduled cleanup.
- Keep server-side authorization checks as the access-control boundary.

### 4. SSO/OIDC Decision

Local email/password authentication is accepted for the `v1.0` single-host internal release.

OIDC, SAML, MFA, SCIM, and identity-provider group sync are deferred until after `v1.0`. If hackd is deployed where centralized identity is a release blocker, OIDC should be reprioritized before tagging.

### 5. Stable Content Schema

- Version the YAML/JSON module and challenge schema.
- Publish schema examples for every supported challenge type.
- Improve validation error messages for content authors.
- Document import idempotency and duplicate-slug behavior.
- Decide how imported content updates existing database-backed modules and challenges.
- Keep demo content clearly marked as sample content.

### 6. Admin Content Workflow Polish

- Add preview-before-publish for modules and challenges.
- Make draft/published/archived transitions safer and clearer.
- Improve validation and runtime configuration forms.
- Consider duplicate/clone actions for modules and challenges.
- Keep authoring workflows approachable for security trainers who are not app developers.

### 7. Backup and Restore Tooling

- Provide executable backup and restore scripts or documented command targets.
- Cover both Postgres and uploaded challenge files.
- Add a restore drill to the release checklist.
- Document expected backup storage and retention assumptions.

### 8. Observability and Operations

- Make request, auth, admin, import, attachment, and runtime events consistently structured.
- Document log fields and operational events.
- Keep `/api/healthz` reliable for liveness checks.
- Consider readiness checks for database and runner dependencies.
- Make challenge runner failures diagnosable from the admin UI and logs.

### 9. Reporting and Compliance Exports

- Preserve existing CSV exports.
- Add date filters where useful.
- Add audit-log export if compliance review is a target use case.
- Document stable CSV columns for completion and attempt exports.
- Keep reports scoped to admin-only server-side authorization.

### 10. Runtime Safety Line

- Treat Dockerized challenges as trusted/internal challenge images unless stronger isolation is added.
- Do not run privileged containers.
- Do not mount the host Docker socket into learner-accessible containers.
- Apply CPU, memory, and PID limits.
- Avoid host filesystem mounts.
- Keep cleanup and expiration behavior reliable.
- Document that rootless Docker, egress controls, image signing, gVisor, Firecracker, and Kubernetes namespaces are future hardening options.

## Suggested Release Ladder

### v0.2: Production-Readiness Foundation

- Documentation cleanup for the `v1.0` release candidate.
- Production deployment guide expansion.
- CSRF protection.
- Durable rate limiting decision and implementation.
- Versioned content schema.
- Branding and theme configuration.

### v0.3: Authoring and Operations

- Admin authoring polish.
- Preview-before-publish.
- Backup and restore scripts or command targets. (Implemented for Compose-managed Postgres and uploads.)
- Restore drill documentation.
- Expanded operational logs.
- Reporting/export improvements.

### v0.4: Runtime Hardening

- Docker image allowlisting. (Implemented for exact image references and prefix patterns.)
- Runner lifecycle reconciliation.
- Scheduled cleanup.
- Stronger runtime failure handling.
- Clear support boundary for trusted challenge images.

### v1.0-rc: Release Candidate

- Full clean-checkout verification.
- Docker Compose smoke test.
- UI smoke test.
- Backup/restore drill.
- Security checklist review.
- Documentation freeze.

### v1.0: Stable Internal Release

- Tag from clean, up-to-date `main`.
- Publish release notes.
- Document known limits and deferred items.
- Keep a rollback path for operators.

## V1 Readiness Checklist

- [x] `README.md`, `REQUIREMENTS.md`, and docs agree on current release state.
- [x] Required commands pass in CI and on a clean local checkout.
- [x] Docker Compose deployment path is documented and tested.
- [x] Secrets and local-only defaults are clearly separated.
- [x] CSRF protection is implemented for state-changing routes.
- [x] Login and challenge submission throttling are appropriate for the single-host internal `v1.0` scope.
- [x] OIDC decision is made and documented.
- [x] Content schema is versioned and documented.
- [x] Admin authoring workflows have preview and safe publish states.
- [x] Backup and restore flow is executable and tested.
- [x] Logs and health checks are sufficient for routine operations.
- [x] CSV exports are documented and stable.
- [x] Docker runtime support boundary is explicit.
- [x] Runtime containers remain unprivileged and resource-limited.
- [x] Release checklist includes a restore drill.
- [x] `v1.0` tag is created from a clean, verified `main`.
