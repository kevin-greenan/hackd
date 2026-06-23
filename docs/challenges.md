# Challenge Workflows

Milestone 4 introduces the first learner challenge submission path.

## Supported Validators

Current validators:

- Static flag: exact string comparison after trimming whitespace
- Short answer: exact text match against configured accepted answers, with optional case-insensitive matching

Unsupported challenge types return a generic disabled response and do not reveal expected answers.

## Learner Flow

1. Learner opens an assigned module at `/modules/[slug]`.
2. Supported challenge sections show an answer input.
3. Submitting an answer records an `Attempt`.
4. Correct attempts award the challenge points.
5. Correct attempts update module completion if all required challenges are complete.
6. Incorrect attempts are recorded without exposing the expected answer.

## Completion Behavior

When an answer is submitted, hackd checks all required challenges for the module.

- If every required challenge has at least one correct attempt, the module `Completion` is set to `COMPLETED`.
- Otherwise, the module `Completion` is set to `IN_PROGRESS`.

## Current Limits

- Multiple-choice UI and validation are not implemented yet.
- File-based and Dockerized challenge submissions are not implemented yet.
- Expected static flags are stored in `validationConfig` for this early local version.
- There is no per-challenge attempt limit yet.
- There is no advanced anti-automation or durable rate limiting for submissions yet.
