# Challenge Workflows

Milestone 4 introduces the first learner challenge submission path.

## Supported Validators

Current validators:

- Static flag: exact string comparison after trimming whitespace
- Short answer: exact text match against configured accepted answers, with optional case-insensitive matching
- Multiple choice: single-answer radio selection or multi-answer checkbox selection against configured option IDs

Unsupported challenge types return a generic disabled response and do not reveal expected answers.

## Learner Flow

1. Learner opens an assigned module at `/modules/[slug]`.
2. Supported challenge sections show an answer input.
3. Submitting an answer records an `Attempt`.
4. Correct attempts award the challenge points.
5. Correct attempts update module completion if all required challenges are complete.
6. Incorrect attempts are recorded without exposing the expected answer.

## Attachments

Admins can upload downloadable files to challenges from `/admin/challenges`.
Learners see attachment download links on assigned module challenge cards.
The download route requires an active session and allows access only to admins or learners assigned to a published module containing the challenge.

Attachment storage is local for v1:

- `FILE_STORAGE_DIR` controls the storage root.
- `MAX_ATTACHMENT_BYTES` controls the upload size limit.
- Docker Compose mounts `hackd-file-uploads` at `/app/data/uploads`.

## Dockerized Web Challenges

Milestone 7 adds a local Docker runtime runner service for `DOCKER_WEB` challenges.

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

- File-based answer submissions are not implemented yet.
- Expected static flags are stored in `validationConfig` for this early local version.
- There is no per-challenge attempt limit yet.
- There is no advanced anti-automation or durable rate limiting for submissions yet.
