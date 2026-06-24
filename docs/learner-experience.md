# Learner Experience

Learners use hackd through the dashboard and module detail pages.

## Flow

1. Learner signs in at `/login`.
2. `/dashboard` shows modules assigned directly to the learner or inherited through group membership.
3. Each assigned module card links to `/modules/[slug]`.
4. The module page shows:
   - Module summary, tags, difficulty, estimate, and due date
   - Markdown lesson content
   - Linked challenge sections
   - Overall and required-challenge progress
   - Recent attempt history
   - Challenge attachment download links
   - Dockerized challenge runtime launch and stop controls
   - Challenge completion state based on correct attempts
   - Submission forms for supported challenge types
   - Module completion status from the `Completion` record

Admins can preview published module pages. Learners only see modules assigned to them or to one of their groups.

The local seed includes `Web Security Practitioner Challenges`, a non-sample challenge set covering password storage, server-side authorization, logging redaction, exposed-secret rotation, CSRF controls, and container runtime guardrails.

## Access Rules

- Learner dashboard access requires an active authenticated user.
- Learner module detail access requires an active authenticated user.
- Non-admin learners can only open published modules assigned directly to them or through group membership.
- Admin users can preview published module pages without a matching assignment.
- Challenge expected answers are not shown in learner views.

## Current Limits

- Static flag, exact-text short-answer, and multiple-choice submissions are implemented.
- Challenge attachment downloads are implemented for assigned published modules.
- Dockerized web challenge launch/stop controls are implemented for assigned published modules.
- Challenge completion reflects correct attempts recorded by the submission flow.
- Module reading progress is not tracked yet.
- Module detail pages render Markdown but do not yet support advanced syntax highlighting.
- Admin reporting includes module, learner, and group filters with completion and attempt CSV exports.

## Next Areas

Future learner work should focus on additional challenge types, richer feedback, durable anti-automation controls, and more granular lesson progress.
