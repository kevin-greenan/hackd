# Docker Deployment

hackd is packaged for local or single-host internal testing with Docker Compose.

The `v1.0` support boundary is a single-host internal deployment. Public SaaS, multi-tenant, horizontally scaled, and hostile-workload cyber range deployments require additional architecture and security hardening.

## Required Configuration

Copy `.env.example` to `.env` and provide:

- `DATABASE_URL`
- `APP_URL`
- `SESSION_SECRET`
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`
- `SEED_LEARNER_EMAIL`
- `SEED_LEARNER_PASSWORD`
- `FILE_STORAGE_DIR`
- `MAX_ATTACHMENT_BYTES`
- `CHALLENGE_SUBMISSION_LIMIT`
- `CHALLENGE_SUBMISSION_WINDOW_SECONDS`
- `RUNTIME_RUNNER_URL`
- `RUNTIME_ALLOWED_IMAGES`
- `CHALLENGE_PUBLIC_HOST`

Optional branding and theme variables are documented in [Branding and themes](branding.md).

Use a unique `SESSION_SECRET` of at least 32 characters. Do not reuse the default local seed passwords outside a private development machine.

The `.env.example` values are development defaults. Rotate the database password, `SESSION_SECRET`, seeded account passwords, and any challenge-specific secrets before sharing the stack with other users.

## Start

```sh
docker compose up --build
```

The web service runs migrations, seeds local data, and starts the standalone Next server:

```sh
./node_modules/.bin/prisma migrate deploy
./node_modules/.bin/tsx prisma/seed.ts
node server.js
```

The runtime image removes global `npm`/`npx` and development-only packages after build. Runtime startup should use local binaries from `node_modules/.bin`.

## Volumes

Docker Compose creates:

- `hackd-postgres-data` for Postgres data.
- `hackd-file-uploads` for challenge attachments.

Back up both volumes before destructive local testing or upgrades.

## Backup

Create a timestamped backup directory containing `postgres.sql`, `uploads.tgz`, and `manifest.txt`:

```sh
npm run ops:backup
```

By default, backups are written under `backups/<UTC timestamp>/`. Override the root directory with `BACKUP_DIR`:

```sh
BACKUP_DIR=/secure/backups npm run ops:backup
```

## Restore

Restore into a running stack from a backup directory:

```sh
npm run ops:restore -- backups/20260623T000000Z
```

Restore replaces database contents through `psql` and replaces files in the upload volume. Test restores before relying on backups for production recovery.

Set `UPLOADS_VOLUME` when the Compose project name changes the generated volume name.

## Runtime Runner

The `runner` service owns Docker socket access. The `web` service talks to the runner through `RUNTIME_RUNNER_URL` and does not mount `/var/run/docker.sock`.

`RUNTIME_ALLOWED_IMAGES` controls which Docker images learner-launched challenges may use. Use a comma-separated list of exact image references and optional prefix patterns ending in `*`, for example:

```env
RUNTIME_ALLOWED_IMAGES="nginxinc/nginx-unprivileged:alpine,ghcr.io/acme-security/hackd-labs/*"
```

This runner is suitable for local internal testing. Before using untrusted challenge workloads in a shared environment, add stronger isolation such as rootless Docker, network egress controls, signed image allowlists, and a hardened sandbox runtime.
