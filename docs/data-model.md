# Core Data Model

Milestone 2 turns the schema foundation into usable local data flows.

## Implemented Foundations

- Users with `ADMIN` and `LEARNER` roles
- Groups and group memberships
- Modules and challenges
- Module-to-challenge links
- Assignments targeting exactly one user or group
- Attempts for learner challenge submissions
- Completions for learner module progress
- Challenge instances and audit logs as schema foundations for later milestones

## Seed Data

`npm run db:seed` creates or updates:

- One admin user from `SEED_ADMIN_EMAIL`
- One learner user from `SEED_LEARNER_EMAIL`
- One sample learner group
- Two published sample modules
- Two published sample challenges
- One direct learner assignment
- One group assignment
- One in-progress completion
- One sample incorrect attempt

The seed script is idempotent and does not print passwords.

## Assignment Target Rule

Assignments must target exactly one user or one group. This is enforced in two places:

- The initial SQL migration has a check constraint.
- `normalizeAssignmentTarget()` rejects missing or dual targets before writes.

## Query Paths

The dashboard currently reads assignments from both:

- Direct user assignments
- Assignments inherited through group membership

Additional indexes support common early reads for assignments, attempts, and completions.
