# Core Data Model

The schema models the core entities needed for local security training: users, groups, content, assignments, submissions, progress, runtime instances, and audit logs.

## Foundations

- Users with `ADMIN` and `LEARNER` roles
- Groups and group memberships
- Modules and challenges
- Module-to-challenge links
- Assignments targeting exactly one user or group
- Attempts for learner challenge submissions
- Completions for learner module progress
- Challenge attachments for downloadable support files
- Challenge instances for Dockerized runtime lifecycle state
- Audit logs for admin mutations

## Seed Data

`npm run db:seed` creates or updates:

- One admin user from `SEED_ADMIN_EMAIL`
- One learner user from `SEED_LEARNER_EMAIL`
- One sample learner group
- Published sample modules
- Published sample challenges
- Direct learner and group assignments
- One in-progress completion
- One sample incorrect attempt

The seed script is idempotent and does not print passwords.

## Assignment Target Rule

Assignments must target exactly one user or one group. This is enforced in two places:

- The initial SQL migration has a check constraint.
- `normalizeAssignmentTarget()` rejects missing or dual targets before writes.

Assignment update and delete paths reconcile stale module completions after a learner loses assignment coverage for that module.

## Query Paths

Learner dashboards read assignments from:

- Direct user assignments
- Assignments inherited through group membership

Additional indexes support common reads for assignments, attempts, completions, attachments, runtime instances, audit logs, and reports.

## Content Import

`npm run content:import -- --file <bundle>` upserts modules and challenges by slug, then upserts `ModuleChallenge` links. The importer validates duplicate slugs and missing challenge references before writing. It does not delete existing content or links that are omitted from a partial bundle.
