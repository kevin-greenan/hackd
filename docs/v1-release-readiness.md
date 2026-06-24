# V1 Release Readiness

This document records the release decisions for the first stable internal `v1.0` tag.

## Release Scope

`v1.0` is an internal, single-host Docker Compose release. It is suitable for trusted teams that need to brand the app, author modules, assign training, run basic challenge labs, view reports, audit admin activity, and recover from routine failures.

`v1.0` is not a public SaaS release, a multi-tenant platform, or a production cyber range for arbitrary hostile workloads.

## Authentication Decision

Local email/password authentication is accepted for `v1.0`.

OIDC, SAML, MFA, SCIM, and identity-provider group sync are deferred until after `v1.0`. If hackd is deployed in an enterprise environment that requires centralized identity before broad access, OIDC should be reprioritized before tagging or rollout.

## Rate Limiting Decision

The current in-memory login and challenge-submission throttles are accepted for the `v1.0` single-host internal scope. They are process-local controls and should not be treated as distributed abuse protection.

Redis-backed, database-backed, or edge-enforced rate limiting remains a post-`v1.0` hardening item for horizontally scaled or internet-exposed deployments.

## Runtime Support Boundary

Dockerized challenge support in `v1.0` is limited to trusted, allowlisted images launched by the internal runner service.

The web container does not mount the Docker socket. Runtime containers are created by the runner without privileged mode, without host filesystem mounts, with all Linux capabilities dropped, with `no-new-privileges`, with a read-only root filesystem, and with memory, CPU, and PID limits.

Before running untrusted challenge images or exposing labs outside a trusted host, add stronger isolation such as rootless Docker, egress controls, image signing, gVisor, Firecracker, or equivalent sandboxing.

## Secrets Boundary

Defaults in `.env.example` are local-development examples. Operators must rotate:

- `SESSION_SECRET`
- `DATABASE_URL` password
- `SEED_ADMIN_PASSWORD`
- `SEED_LEARNER_PASSWORD`

Do not commit real `.env` files, challenge secrets, static flags for private content, or production backup artifacts.

## Release Gates

Before creating the `v1.0` tag:

- Run `npm run release:check` on a clean checkout.
- Run `npm run smoke:compose`.
- Run `npm run ui:smoke` against a freshly built Compose stack.
- Run `npm run container:scan` after building `web` and `runner`.
- Import `examples/content/secure-notes.yaml` with `--dry-run`.
- Run `npm run ops:backup`.
- Restore that backup into a disposable Compose stack with `npm run ops:restore -- <backup-directory>`.
- Confirm no real secrets are present in `.env`, logs, commits, docs, or release notes.

## Deferred After V1

- OIDC/SAML/MFA/SCIM.
- Distributed rate limiting.
- Password reset.
- Scheduled reports.
- File-based answer submissions.
- Dynamic flags.
- Git-backed content repositories.
- Stronger runtime sandboxing for hostile workloads.
