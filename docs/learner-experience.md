# Learner Experience

Milestone 3 adds the first real learner flow on top of the seeded data model.

## Current Flow

1. Learner signs in at `/login`.
2. `/dashboard` shows assigned modules from direct user assignments and group assignments.
3. Each assigned module card links to `/modules/[slug]`.
4. The module page shows:
   - Module summary, tags, difficulty, estimate, and due date
   - Markdown lesson content
   - Linked challenge sections
   - Challenge completion state based on correct attempts
   - Submission forms for supported challenge types
   - Module completion status from the `Completion` record

Admins can also open module pages for preview, but learners only see modules assigned to them or to one of their groups.

## Access Rules

- Learner dashboard access requires an active authenticated user.
- Learner module detail access requires an active authenticated user.
- Non-admin learners can only open published modules assigned directly to them or through group membership.
- Admin users can preview published module pages without a matching assignment.
- Challenge expected answers are not shown in learner views.

## Current Limits

- Static flag and exact-text short-answer submissions are implemented.
- Challenge completion reflects correct attempts recorded by the submission flow.
- Module reading progress is not tracked yet.
- Module detail pages render Markdown but do not yet support syntax highlighting beyond readable code blocks.
- Admin authoring and assignment management UI are deferred to a later milestone.

## Next Step

Next milestones should expand challenge types, admin CRUD, assignment management, and reporting.
