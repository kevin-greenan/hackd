# Content Import

The content importer lets developers load local module and challenge bundles from YAML or JSON.

## Commands

Validate and import a bundle:

```sh
npm run content:import -- --file examples/content/secure-notes.yaml
```

Preview the create/update plan without writing:

```sh
npm run content:import -- --file examples/content/secure-notes.yaml --dry-run
```

By default, new rows are attributed to the admin account from `SEED_ADMIN_EMAIL`. To choose another admin:

```sh
npm run content:import -- --file examples/content/secure-notes.yaml --actor-email admin@example.com
```

## Bundle Shape

Bundles must use `version: 1` and may be `.yaml`, `.yml`, or `.json`.

See the full [Content Schema V1 reference](content-schema/v1.md) for field constraints, supported validation configs, runtime configs, and import semantics.

```yaml
version: 1
modules:
  - title: Secure Notes Basics
    slug: secure-notes-basics
    summary: Practice reviewing authorization checks.
    bodyFile: secure-notes.md
    difficulty: beginner
    estimatedMinutes: 30
    status: PUBLISHED
    tags:
      - appsec
    challenges:
      - slug: secure-notes-static-flag
        sortOrder: 1
        required: true
challenges:
  - title: Secure Notes Static Flag
    slug: secure-notes-static-flag
    description: Submit the sample flag shown in the lesson.
    type: STATIC_FLAG
    difficulty: beginner
    points: 25
    status: PUBLISHED
    tags:
      - platform
    validationConfig:
      type: static_flag
      flag: flag{secure-notes}
    runtimeConfig: null
```

Each module must define exactly one lesson body source:

- `bodyMarkdown`: inline Markdown content.
- `bodyFile`: relative Markdown file path next to the bundle.

Absolute paths and parent-directory escapes are rejected.

## Validation

The importer fails before writing when:

- A module slug is duplicated in the bundle.
- A challenge slug is duplicated in the bundle.
- A module links to a challenge slug that is not defined in the bundle.
- A module links to the same challenge more than once.
- A field violates the same broad constraints used by the admin UI, such as slug shape, status enum, challenge type enum, or point bounds.

## Import Behavior

The importer upserts modules and challenges by slug, then upserts module-to-challenge links. It does not delete omitted links or content, so existing local work is not removed by a partial bundle.

## Examples

Schema V1 examples are available in `examples/content/schema-v1/`:

- `static-flag.yaml`
- `short-answer.yaml`
- `multiple-choice.yaml`
- `file-based.yaml`
- `docker-web.yaml`
