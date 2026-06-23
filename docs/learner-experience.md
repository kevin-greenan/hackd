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
   - Module completion status from the `Completion` record

Admins can also open module pages for preview, but learners only see modules assigned to them or to one of their groups.

## Access Rules

- Learner dashboard access requires an active authenticated user.
- Learner module detail access requires an active authenticated user.
- Non-admin learners can only open published modules assigned directly to them or through group membership.
- Admin users can preview published module pages without a matching assignment.
- Challenge expected answers are not shown in learner views.

## Current Limits

- Challenge submission forms are not implemented yet.
- Challenge completion only reflects existing attempt data.
- Module reading progress is not tracked yet.
- Module detail pages render Markdown but do not yet support syntax highlighting beyond readable code blocks.
- Admin authoring and assignment management UI are deferred to a later milestone.

## Next Step

Milestone 4 should add the first challenge workflow: static flag submission, validation, attempt recording, and completion updates.
