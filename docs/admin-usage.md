# Admin Usage

This guide covers the current admin workflows for local internal testing.

## Access

1. Start the stack with `docker compose up --build`.
2. Sign in at `/login` with the configured admin account.
3. Open `/admin` from the dashboard.

Default Docker Compose credentials are documented in the README and are for local development only.

## Users and Groups

- `/admin/users` creates and updates local users.
- Users can be assigned `ADMIN` or `LEARNER` roles and `ACTIVE` or `DISABLED` status.
- `/admin/groups` creates learner groups that can receive module assignments.
- Groups can be deleted only when they have no members or assignments.

## Content

- `/admin/modules` creates modules, edits Markdown lesson bodies, and links challenges.
- `/admin/challenges` creates challenges, edits type-specific validation/runtime settings, and manages downloadable attachments.
- The content import CLI can upsert modules and challenges from YAML/JSON bundles:

```sh
npm run content:import -- --file examples/content/secure-notes.yaml --dry-run
```

## Assignments

- `/admin/assignments` assigns modules to exactly one learner or group.
- Direct learner assignments and group assignments both appear on learner dashboards.
- Assignment update and delete reconcile learner completions when a learner no longer has a direct or group assignment for the affected module.

## Runtime Instances

- `/admin/instances` shows Dockerized challenge instances.
- Admins can stop running instances and clean up expired instances.

## Reporting and Audit

- `/admin/reports` shows learner progress, module progress, challenge performance, and recent attempts.
- Reports can be filtered by module, learner, or group.
- Completion and attempt CSV exports preserve selected filters.
- `/admin/audit` shows recent admin mutations for user, group, module, challenge, attachment, and assignment workflows.
