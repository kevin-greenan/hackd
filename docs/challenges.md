# Challenge Workflows

hackd supports several local challenge types and records every learner submission as an attempt.

## Supported Validators

- Static flag: exact string comparison after trimming whitespace.
- Short answer: exact text match against configured accepted answers, with optional case-insensitive matching.
- Multiple choice: single-answer radio selection or multi-answer checkbox selection against configured option IDs.

Admins configure these validators with type-specific fields in `/admin/challenges`. The form writes the underlying `validationConfig` and `runtimeConfig` JSON for portability and content import compatibility.

Unsupported challenge types return a disabled response without revealing expected answers.

## Learner Flow

1. Learner opens an assigned module at `/modules/[slug]`.
2. Supported challenge sections show an answer input.
3. Submitting an answer records an `Attempt`.
4. Correct attempts award the challenge points.
5. Correct attempts update module completion if all required challenges are complete.
6. Incorrect attempts are recorded without exposing the expected answer.

## Attachments

Admins can upload downloadable files to challenges from `/admin/challenges`. Learners see attachment download links on assigned module challenge cards.

The download route requires an active session and allows access only to admins or learners assigned to a published module containing the challenge.

Attachment storage is local:

- `FILE_STORAGE_DIR` controls the storage root.
- `MAX_ATTACHMENT_BYTES` controls the upload size limit.
- Docker Compose mounts `hackd-file-uploads` at `/app/data/uploads`.

## Dockerized Web Challenges

`DOCKER_WEB` challenges use the internal runtime runner service.

- `runtimeConfig.type` must be `docker_web`.
- `runtimeConfig.image` names the Docker image to pull and launch.
- `runtimeConfig.containerPort` defaults to `80`.
- `runtimeConfig.memoryMb`, `runtimeConfig.cpuCount`, and `runtimeConfig.ttlMinutes` are bounded by server-side validation.
- Learners assigned to the containing published module can launch, open, and stop an instance.
- Admins can review, stop, and clean up instances from `/admin/instances`.

Docker Compose runs the runner as a separate service with access to `/var/run/docker.sock`; the web service talks to it through `RUNTIME_RUNNER_URL`.

## Completion Behavior

When an answer is submitted, hackd checks all required challenges for the module.

- If every required challenge has at least one correct attempt, the module `Completion` is set to `COMPLETED`.
- Otherwise, the module `Completion` is set to `IN_PROGRESS`.

## Current Limits

- File-based answer submissions are planned.
- Expected static flags are stored in `validationConfig` for this local foundation.
- There is no per-challenge attempt limit yet.
- Submission throttling is in-memory and should move to durable infrastructure before production use.
- There is no advanced anti-automation for submissions yet.
