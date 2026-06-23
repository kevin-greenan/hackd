# Reporting Exports

Admin CSV exports are available from `/admin/reports` and require server-side `ADMIN` authorization.

Exports preserve the selected report filters:

- `moduleId`
- `learnerId`
- `groupId`

CSV values are quoted when needed, doubled quotes are escaped, and `Date` values are serialized as ISO 8601 strings.

## Completion Export

Endpoint:

```text
GET /admin/reports/completions.csv
```

Filename:

```text
hackd-completions.csv
```

Columns:

| Column | Description |
| --- | --- |
| `learner_name` | Learner display name. |
| `learner_email` | Learner email address. |
| `module_title` | Module title. |
| `module_slug` | Stable module slug. |
| `status` | Completion status: `NOT_STARTED`, `IN_PROGRESS`, or `COMPLETED`. |
| `completed_at` | ISO timestamp when completed, or empty. |
| `updated_at` | ISO timestamp when the completion row last changed. |

Current limit: newest 1000 matching completion rows ordered by learner email and module title.

## Attempt Export

Endpoint:

```text
GET /admin/reports/attempts.csv
```

Filename:

```text
hackd-attempts.csv
```

Columns:

| Column | Description |
| --- | --- |
| `created_at` | ISO timestamp when the attempt was recorded. |
| `learner_name` | Learner display name. |
| `learner_email` | Learner email address. |
| `challenge_title` | Challenge title. |
| `challenge_slug` | Stable challenge slug. |
| `challenge_type` | Challenge type enum. |
| `result` | Attempt result: `CORRECT`, `INCORRECT`, or `PENDING_REVIEW`. |
| `score_awarded` | Score awarded for the attempt. |
| `points` | Maximum challenge points. |

Current limit: newest 1000 matching attempts ordered by submission time descending.

## Compatibility Notes

- CSV column names are treated as a stable reporting contract for Schema V1-era exports.
- New columns should be appended rather than inserted between existing columns.
- Existing columns should not be renamed without a documented export version change.
