# Operations Runbook

This runbook is for local internal testing and demo preparation.

## Start and Stop

Start the stack:

```sh
docker compose up --build
```

Stop the stack:

```sh
docker compose down
```

Run the automated compose smoke test:

```sh
npm run smoke:compose
```

Run browser UI smoke tests against a running stack:

```sh
npm run ui:smoke
```

## Health Checks

App and database:

```sh
curl -fsS http://localhost:3000/api/healthz
```

Runner:

```sh
curl -fsS http://localhost:4010/healthz
```

## Logs

Application logs:

```sh
docker compose logs web
```

Runner logs:

```sh
docker compose logs runner
```

Important application events are written as single-line JSON logs with `level`, `event`, and `timestamp` fields.

## Content Import

Validate sample content without writing:

```sh
npm run content:import -- --file examples/content/secure-notes.yaml --dry-run
```

Import sample content:

```sh
npm run content:import -- --file examples/content/secure-notes.yaml
```

## Security Checks

Run local security checks:

```sh
npm run security:check
```

The current check runs `npm audit --omit=dev` and scans tracked source files for common secret patterns. It is intentionally local and free of paid GitHub security features.

Run container scanning after images are built:

```sh
npm run container:scan
```

The container scan uses Trivy against the local `hackd-web:latest` and `hackd-runner:latest` images.

## Demo Checklist

1. Start the stack.
2. Sign in as the seeded admin.
3. Open Users, Groups, Modules, Challenges, Assignments, Instances, Reports, and Audit.
4. Dry-run and optionally import `examples/content/secure-notes.yaml`.
5. Sign in as the seeded learner.
6. Open an assigned module, submit a wrong answer, then submit a correct seeded challenge answer.
7. Launch and stop the sample Dockerized web challenge.
8. Confirm `/api/healthz` reports app and database OK.
