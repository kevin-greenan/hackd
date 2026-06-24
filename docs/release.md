# Release Checklist

Use this checklist for the first stable internal release tag.

Release scope, authentication, rate limiting, runtime, and secrets decisions are recorded in [V1 release readiness](v1-release-readiness.md).

## Preflight

Run the release check:

```sh
npm run release:check
```

Run the Compose smoke test:

```sh
npm run smoke:compose
```

Run the browser UI smoke test against a running Compose stack:

```sh
docker compose up -d --build
npm run ui:smoke
docker compose down
```

Run the container scan after Compose has built images:

```sh
docker compose build web runner
npm run container:scan
```

## Review

- Confirm README setup commands work on a clean checkout.
- Confirm seeded admin and learner credentials work locally.
- Confirm `/admin`, `/dashboard`, `/admin/reports`, and `/api/healthz` load.
- Confirm `examples/content/secure-notes.yaml` can be imported with `--dry-run`.
- Confirm login, logout, admin mutations, learner submissions, and runtime controls include and enforce CSRF tokens.
- Confirm `npm run ops:backup` creates a database dump, uploads archive, and manifest.
- Confirm `npm run ops:restore -- <backup-directory>` works against a disposable stack before tagging.
- Confirm no real secrets are present in `.env`, logs, commits, or docs.
- Confirm the release PR has merged to `main`.

## Tag

Tag only from a clean, up-to-date `main` branch after all release gates pass:

```sh
git checkout main
git pull --ff-only origin main
git tag -s v1.0.0 -m "v1.0.0"
git push origin v1.0.0
```

If signed tags are not configured locally, use an annotated tag instead:

```sh
git tag -a v1.0.0 -m "v1.0.0"
git push origin v1.0.0
```
