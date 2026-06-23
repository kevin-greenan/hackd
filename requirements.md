hackd Requirements & Delivery Roadmap

hackd is a containerized security training platform runtime for building, assigning, running, validating, and tracking hands-on security learning modules.

The project is the application and infrastructure layer only. It does not initially include a full training curriculum. Content should be authored separately as modules and challenges that the platform can ingest, render, run, and score.

1. Product Summary

1.1 Purpose

hackd provides a modern, admin-managed platform for security training that supports:

* Narrative learning modules
* Hands-on security challenges
* Role-based assignments
* Challenge validation and scoring
* Learner progress tracking
* Admin reporting
* Containerized local and server deployment

The platform should support CTF-style challenges, secure coding labs, code review exercises, incident response simulations, detection engineering exercises, policy-aware training modules, and other security learning formats.

1.2 Product Positioning

hackd is not primarily a competition platform.

It is a security learning runtime for structured, role-aware, hands-on training.

Comparable products and inspirations:

* CTFd.io
* pwn.college
* Secure Code Warrior Learning
* Internal cyber ranges
* Lightweight LMS systems
* Git-backed engineering education platforms

1.3 Core Design Principle

The platform should separate:

* Application/runtime infrastructure
* Training content
* Challenge execution environments
* Validation logic
* Learner progress data

Content should be portable and versionable. The application should be able to ingest modules and challenges from structured definitions, eventually from Git-backed content repositories.

2. Target Users

2.1 Learners

Learners complete assigned modules and challenges.

Example learner audiences:

* Software engineers
* Security engineers
* IT administrators
* Product managers
* Legal/privacy stakeholders
* Executives
* New hires
* Incident response participants

2.2 Training Admins

Admins create, import, configure, assign, and manage training modules and challenges.

Admins need visibility into:

* Module completion
* Challenge attempts
* Learner progress
* Team-level progress
* Skill/category coverage
* Assessment outcomes

2.3 Platform Operators

Operators deploy, configure, and maintain the platform.

Operators care about:

* Containerization
* Configuration management
* Database migrations
* Authentication
* Logging
* Backups
* Challenge runtime isolation
* Resource limits
* Observability

3. Core Product Concepts

3.1 Module

A module is a structured learning unit.

A module may contain:

* Metadata
* Narrative content
* Learning objectives
* One or more challenges
* Knowledge checks
* Hints
* Completion rules
* Tags
* Audience definitions
* Difficulty level
* Estimated time
* Prerequisites

Example module types:

* Secure coding lesson
* Vulnerability walkthrough
* Code review exercise
* Incident response scenario
* Detection engineering lab
* Company-specific onboarding module
* Policy-aware scenario
* Executive decision simulation

3.2 Lesson

A lesson is narrative or instructional content inside a module.

Supported v1 lesson format:

* Markdown

Future formats:

* MDX
* Embedded diagrams
* Code tabs
* Callouts
* Interactive walkthroughs
* Video embeds
* Mermaid diagrams

3.3 Challenge

A challenge is a hands-on or assessed activity.

Initial challenge types:

* Static flag challenge
* Multiple-choice knowledge check
* Short-answer challenge
* Code review challenge
* File-based challenge
* Dockerized web challenge

Future challenge types:

* Patch-the-code challenge
* Unit-test-validated challenge
* Detection query challenge
* Log analysis challenge
* Cloud/IAM policy analysis challenge
* Incident response scenario
* Threat modeling exercise
* Manual review submission
* Multi-step chained challenge

3.4 Assignment

An assignment maps modules to learners or groups.

Assignments should support:

* Individual learners
* Groups
* Roles
* Due dates
* Required/optional status
* Completion tracking

3.5 Attempt

An attempt records learner interaction with a challenge.

Attempts should include:

* Learner
* Challenge
* Submitted answer or flag
* Timestamp
* Result
* Score
* Validation response
* Number of attempts
* Optional metadata

3.6 Completion

Completion records whether a learner has satisfied the requirements for a module.

Completion may depend on:

* Reading required lesson sections
* Passing required challenges
* Achieving a minimum score
* Completing all required tasks
* Admin approval for manual-review challenges

4. Functional Requirements

4.1 Authentication and Authorization

4.1.1 Requirements

The platform shall support authenticated users.

Required roles for v1:

* admin
* learner

Future roles:

* author
* reviewer
* operator
* manager

4.1.2 V1 Acceptance Criteria

* A user can register or be created locally.
* A user can log in and log out.
* Admin users can access admin routes.
* Learners cannot access admin routes.
* Session state persists across page refreshes.
* Passwords are securely hashed.
* Role checks are enforced server-side.

4.1.3 Future Requirements

* SSO via OIDC
* SAML support
* SCIM provisioning
* Group sync from identity provider
* MFA support
* Audit logging for admin actions

4.2 Learner Dashboard

4.2.1 Requirements

Learners need a dashboard showing assigned and available training.

The dashboard shall display:

* Assigned modules
* Completion status
* Due dates, if applicable
* Difficulty
* Estimated time
* Tags
* Progress indicators
* Recently started modules
* Completed modules

4.2.2 V1 Acceptance Criteria

* Learner can view assigned modules.
* Learner can distinguish not started, in progress, and completed modules.
* Learner can open a module from the dashboard.
* Learner can see challenge completion state within a module.

4.3 Module Rendering

4.3.1 Requirements

The platform shall render module content in a clean, modern learning interface.

A module page shall support:

* Title
* Summary
* Difficulty
* Estimated time
* Tags
* Learning objectives
* Markdown lesson sections
* Embedded challenge sections
* Hints
* Progress state
* Completion state

4.3.2 V1 Acceptance Criteria

* Markdown lessons render correctly.
* Code blocks render with syntax highlighting.
* Challenges render inline or as linked challenge pages.
* Learner progress updates when required challenge activities are completed.
* Module layout is usable on desktop and tablet screen sizes.

4.4 Challenge Management

4.4.1 Requirements

Admins shall be able to create and manage challenges.

Challenge metadata shall include:

* Title
* Slug
* Description
* Type
* Difficulty
* Tags
* Points
* Hints
* Validation method
* Visibility
* Associated module
* Optional attached files
* Optional Docker runtime configuration

4.4.2 V1 Challenge Types

Static Flag Challenge

Learner submits a flag. Platform validates the submitted value.

Requirements:

* Store expected flag securely enough for v1.
* Compare submitted flag to expected flag.
* Record correct and incorrect attempts.
* Mark challenge complete when correct.

Multiple Choice Challenge

Learner selects one or more answers.

Requirements:

* Support single-answer multiple choice.
* Support multiple-answer multiple choice.
* Record selected answer.
* Validate correctness.
* Mark complete when correct or when passing criteria is satisfied.

Short Answer Challenge

Learner submits free text.

Requirements:

* Support exact-match validation.
* Support case-insensitive validation option.
* Support admin-defined accepted answers.

File-Based Challenge

Learner downloads or views files and submits an answer.

Requirements:

* Admin can attach files to a challenge.
* Learner can download files.
* Platform records attempts and completion.

Dockerized Web Challenge

Learner launches a containerized challenge environment.

Requirements:

* Challenge definition can reference a Docker image or build context.
* Platform can start a challenge instance.
* Learner receives a challenge URL.
* Platform can stop and clean up a challenge instance.
* Platform enforces basic resource limits.
* Platform records instance lifecycle events.

4.4.3 Future Challenge Types

* Patch-the-code with unit test validation
* Detection engineering query validation
* Log analysis challenges
* Cloud policy analysis
* Manual-review challenges
* Scenario branching
* Timed exercises
* Team challenges
* Chained challenges
* Dynamic per-user flags

4.5 Challenge Validation

4.5.1 Requirements

The validation system shall be extensible.

Initial validators:

* Static flag validator
* Exact text validator
* Multiple choice validator

Future validators:

* Dynamic flag validator
* HTTP callback validator
* Unit test validator
* Regex validator
* Admin manual-review validator
* Container-exec validator
* Log query validator
* API-response validator

4.5.2 V1 Acceptance Criteria

* Each challenge type has an associated validator.
* Validation result is recorded.
* Incorrect submissions are recorded.
* Correct submissions update challenge completion.
* Validation responses do not leak expected answers.
* Admins can view attempt history.

4.6 Admin Dashboard

4.6.1 Requirements

Admins need a central dashboard for managing training.

Admin dashboard shall include:

* Module list
* Challenge list
* User list
* Group list
* Assignment list
* Completion summary
* Recent attempts
* Basic platform health indicators

4.6.2 V1 Acceptance Criteria

* Admin can view all modules.
* Admin can view all challenges.
* Admin can view all users.
* Admin can assign a module to a user.
* Admin can view learner progress.
* Admin can view challenge attempts.

4.7 Module Authoring

4.7.1 Requirements

Admins shall be able to create and edit modules.

V1 module authoring may be implemented through:

* Admin web UI
* Structured local files
* Seed data
* Import from YAML/JSON/Markdown

Preferred direction:

* Support file-based module definitions early.
* Web UI can manage database-backed modules.
* Future Git-backed content import should be possible.

4.7.2 V1 Acceptance Criteria

* Admin can create a module with title, slug, summary, difficulty, estimated time, tags, and Markdown body.
* Admin can associate challenges with a module.
* Admin can publish or unpublish a module.
* Learners only see published modules assigned to them or available to them.

4.7.3 Future Requirements

* Git-backed module repositories
* Module versioning
* Module cloning
* Draft/published workflow
* Review workflow
* Import/export module bundles
* Content linting
* Schema validation
* Dependency/prerequisite enforcement

4.8 User and Group Management

4.8.1 Requirements

Admins shall be able to manage learners and groups.

V1 requirements:

* Create user
* Edit user role
* Disable user
* Create group
* Add users to group
* Remove users from group
* Assign module to user
* Assign module to group

4.8.2 Future Requirements

* Identity provider group sync
* Manager/team hierarchy
* Bulk import users
* Invite links
* Domain-based enrollment
* Self-enrollment by module

4.9 Reporting

4.9.1 Requirements

Admins shall be able to report on learner progress and challenge performance.

Reports shall include:

* Module completion by user
* Module completion by group
* Challenge success/failure rate
* Attempts per challenge
* Average time to complete
* Overdue assignments
* Skill/tag coverage

4.9.2 V1 Acceptance Criteria

* Admin can see completion status by learner.
* Admin can see completion status by module.
* Admin can view all attempts for a challenge.
* Admin can export a CSV of module completions.

4.9.3 Future Requirements

* Control mapping reports
* Compliance evidence export
* PDF reports
* Scheduled reports
* Skill matrix
* Trend reporting
* API access for reporting
* Webhooks

4.10 Containerization

4.10.1 Requirements

The platform shall be containerized for local development and deployment.

V1 shall include Docker Compose services for:

* Web frontend
* API/backend
* Database
* Worker
* Challenge runner, if separate
* Redis or queue service, if needed

4.10.2 V1 Acceptance Criteria

* docker compose up starts the platform.
* Local developer can access the web app from the browser.
* Database migrations run successfully.
* Seed admin user can be created.
* Services have health checks.
* Environment variables are documented.
* Persistent volumes are defined for database state.
* Challenge containers can be launched locally for supported Dockerized challenges.

4.11 Modern Interface

4.11.1 Requirements

The interface shall be modern, clean, responsive, and suitable for professional internal security training.

Preferred frontend direction:

* TypeScript
* React
* Next.js or equivalent modern JS framework
* Component-based UI
* Tailwind CSS or equivalent utility-first styling
* Accessible components
* Dark mode support
* Responsive layout
* Syntax-highlighted code blocks
* Modern dashboard patterns

4.11.2 UX Principles

* Minimal clutter
* Clear hierarchy
* Fast navigation
* Good code readability
* Useful empty states
* Obvious progress indicators
* Admin and learner experiences should feel distinct
* Avoid game-only styling unless specifically configured
* Avoid overly childish badges/rewards
* Make the platform feel serious but not sterile

4.11.3 V1 Acceptance Criteria

* App has a polished landing/login screen.
* Learner dashboard is responsive and readable.
* Module view supports rich Markdown and code blocks.
* Admin dashboard is usable without developer knowledge.
* Forms have validation and useful error messages.
* UI has consistent spacing, typography, and component styling.
* Application includes dark mode or is architected to support it easily.

5. Non-Functional Requirements

5.1 Security Requirements

The platform is a security training application and must be built with a security-first posture.

V1 requirements:

* Server-side authorization checks
* Secure password hashing
* CSRF protection where applicable
* Secure session handling
* Input validation
* Output encoding
* Parameterized database queries
* No secrets committed to repo
* Environment-based configuration
* Basic rate limiting for auth and submissions
* Audit log for security-relevant admin actions
* Safe file upload constraints
* Docker challenge resource limits
* No privileged challenge containers by default

Future requirements:

* SSO/OIDC
* SAML
* Advanced audit trails
* Secret management integration
* Per-user challenge network isolation
* Egress controls
* Sandboxed code execution
* Runtime policy enforcement
* Vulnerability scanning in CI
* SBOM generation
* Signed challenge images
* Tenant isolation, if SaaS is pursued

5.2 Performance Requirements

V1 performance goals:

* Dashboard loads in under 2 seconds locally with seed data.
* Module pages load in under 2 seconds locally.
* Static challenge validation completes in under 500ms.
* Docker challenge launch should provide status feedback immediately.
* Background challenge startup may take longer but must not block the entire app UI.

5.3 Reliability Requirements

V1 reliability goals:

* Failed validation attempts should not crash the app.
* Failed challenge container launch should show useful error state.
* Worker failures should be logged.
* Restarting app containers should not lose database state.
* Challenge cleanup should run periodically.
* Orphaned challenge containers should be detectable.

5.4 Maintainability Requirements

V1 maintainability goals:

* TypeScript preferred across frontend and backend when practical.
* Clear project structure.
* Linting and formatting configured.
* Database schema migrations.
* Unit tests for validation logic.
* Integration tests for core API flows.
* Seed data for local development.
* README with setup instructions.
* .env.example included.
* Architecture notes included.

5.5 Observability Requirements

V1 requirements:

* Structured application logs
* Request logging
* Error logging
* Challenge lifecycle logging
* Health check endpoint
* Basic metrics endpoint or future-ready structure

Future requirements:

* OpenTelemetry
* Prometheus metrics
* Grafana dashboard
* Admin-visible platform health
* Worker queue visibility

6. Suggested Technical Architecture

6.1 Recommended Stack

Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui or equivalent component library
* Markdown/MDX rendering
* Code syntax highlighting

Backend

Acceptable options:

Option A:

* Next.js full-stack application
* API routes/server actions
* Prisma ORM
* Postgres

Option B:

* Next.js frontend
* FastAPI backend
* SQLAlchemy
* Postgres

Option C:

* Next.js frontend
* NestJS backend
* Prisma
* Postgres

Preferred v1 for development speed:

* Next.js
* TypeScript
* Prisma
* Postgres
* Docker Compose

Background Jobs

* Redis
* BullMQ

Background jobs should support:

* Challenge start
* Challenge stop
* Challenge cleanup
* Future validation jobs
* Future reporting jobs

Challenge Runtime

V1:

* Docker Engine via controlled runner service
* Docker Compose for local challenge definitions where appropriate

Future:

* Kubernetes runner
* Nomad runner
* Firecracker/microVM isolation
* Ephemeral sandbox pools

6.2 Logical Components

hackd-web

User-facing frontend.

Responsibilities:

* Login UI
* Learner dashboard
* Module rendering
* Challenge interaction UI
* Admin dashboard
* Reporting views

hackd-api

Application API.

Responsibilities:

* Auth
* RBAC
* Module CRUD
* Challenge CRUD
* Assignment CRUD
* Attempt submission
* Reporting endpoints
* Admin operations

hackd-worker

Background worker.

Responsibilities:

* Start challenge instances
* Stop challenge instances
* Cleanup expired challenge instances
* Run async validations
* Process scheduled jobs

hackd-runner

Challenge runtime adapter.

Responsibilities:

* Interact with Docker
* Enforce runtime configuration
* Allocate ports
* Track instance state
* Cleanup containers
* Enforce resource limits

For v1, hackd-worker and hackd-runner may be the same service. They should remain logically separable.

hackd-db

Postgres database.

hackd-cache

Redis cache and job queue.

7. Data Model Requirements

7.1 Core Entities

User

Fields:

* id
* email
* name
* password_hash
* role
* status
* created_at
* updated_at

Group

Fields:

* id
* name
* slug
* description
* created_at
* updated_at

GroupMembership

Fields:

* id
* user_id
* group_id
* created_at

Module

Fields:

* id
* title
* slug
* summary
* body_markdown
* difficulty
* estimated_minutes
* status
* tags
* created_by
* created_at
* updated_at

Challenge

Fields:

* id
* title
* slug
* description
* type
* difficulty
* points
* tags
* validation_config
* runtime_config
* status
* created_by
* created_at
* updated_at

ModuleChallenge

Fields:

* id
* module_id
* challenge_id
* sort_order
* required
* created_at

Assignment

Fields:

* id
* module_id
* user_id
* group_id
* assigned_by
* due_at
* required
* created_at
* updated_at

Rules:

* Assignment can target either user or group.
* Assignment must not target both user and group at the same time unless explicitly supported later.

Attempt

Fields:

* id
* user_id
* challenge_id
* submitted_value
* result
* score_awarded
* feedback
* created_at

Completion

Fields:

* id
* user_id
* module_id
* status
* completed_at
* created_at
* updated_at

ChallengeInstance

Fields:

* id
* user_id
* challenge_id
* status
* container_id
* image
* url
* port
* started_at
* expires_at
* stopped_at
* created_at
* updated_at

AuditLog

Fields:

* id
* actor_user_id
* action
* target_type
* target_id
* metadata
* ip_address
* user_agent
* created_at

8. Module Definition Format

V1 should support a structured module definition format that can later be imported from Git.

Example:

id: intro-ssrf
title: Intro to SSRF
summary: Learn how server-side request forgery can expose internal services.
difficulty: intermediate
estimated_minutes: 45
tags:
  - appsec
  - ssrf
  - web
audiences:
  - backend-engineers
objectives:
  - Explain what SSRF is.
  - Identify unsafe URL fetching behavior.
  - Complete a basic SSRF challenge.
content:
  - type: markdown
    file: lesson.md
  - type: challenge
    challenge: ssrf-basic-fetcher
completion:
  required_challenges:
    - ssrf-basic-fetcher

9. Challenge Definition Format

Example static flag challenge:

id: ssrf-basic-fetcher
title: Basic SSRF Fetcher
type: static_flag
difficulty: intermediate
points: 100
tags:
  - ssrf
  - web
description: Exploit the vulnerable URL fetcher and retrieve the flag.
hints:
  - Look for services reachable from the application but not from your browser.
validation:
  type: static_flag
  flag: flag{example}

Example Dockerized web challenge:

id: path-traversal-web
title: Path Traversal Web Lab
type: docker_web
difficulty: beginner
points: 100
tags:
  - appsec
  - path-traversal
description: Exploit a vulnerable file download endpoint.
runtime:
  type: docker
  image: hackd/path-traversal-web:latest
  internal_port: 3000
  memory_limit: 256m
  cpu_limit: 0.5
  timeout_minutes: 45
validation:
  type: static_flag
  flag_env: HACKD_FLAG

10. Repository Structure

Recommended initial repo structure:

hackd/
  apps/
    web/
      app/
      components/
      lib/
      styles/
      tests/
  packages/
    db/
      prisma/
      migrations/
      seed/
    core/
      src/
        auth/
        rbac/
        modules/
        challenges/
        validation/
        assignments/
        reporting/
    runner/
      src/
        docker/
        lifecycle/
        cleanup/
  content/
    examples/
      modules/
      challenges/
  infra/
    docker/
    compose/
  docs/
    architecture.md
    module-format.md
    challenge-format.md
    security.md
    operations.md
  scripts/
    dev.sh
    seed.sh
    migrate.sh
  .env.example
  docker-compose.yml
  Dockerfile
  README.md
  REQUIREMENTS.md

If using a simpler initial structure:

hackd/
  app/
  components/
  lib/
  prisma/
  content/
  docs/
  infra/
  scripts/
  docker-compose.yml
  Dockerfile
  README.md
  REQUIREMENTS.md

The simpler structure is acceptable for v1, but the project should avoid becoming tangled. The runner/runtime logic should remain easy to extract later.

11. Milestones

Milestone 0: Project Bootstrap

Goal

Create the repo, establish the technical foundation, and make local development easy.

Deliverables

* Initial repository structure
* README
* License decision
* .env.example
* Docker Compose baseline
* Frontend framework initialized
* Database connected
* ORM configured
* Linting and formatting
* Basic CI workflow
* Health check endpoint

Tasks

* Create hackd git repository.
* Initialize Next.js TypeScript app.
* Configure Tailwind CSS.
* Add component library.
* Add Postgres service to Docker Compose.
* Add Redis service to Docker Compose.
* Add Prisma or selected ORM.
* Create initial database schema.
* Add migration command.
* Add seed command.
* Create .env.example.
* Add docker-compose.yml.
* Add application Dockerfile.
* Add development README.
* Add linting.
* Add formatting.
* Add basic test framework.
* Add GitHub Actions CI for lint/test/build.
* Add /healthz endpoint.

Acceptance Criteria

* docker compose up starts the app and database.
* Developer can open the web app locally.
* Database migrations run successfully.
* Seed script creates initial admin user.
* CI runs successfully on pull request.

Milestone 1: Authentication and RBAC

Goal

Implement local authentication and basic role-based access control.

Deliverables

* Login screen
* Logout flow
* Session handling
* Admin and learner roles
* Protected routes
* Seeded admin user

Tasks

* Create User model.
* Add password hashing.
* Implement login API.
* Implement logout API.
* Implement session persistence.
* Implement current-user endpoint.
* Add admin role.
* Add learner role.
* Protect admin routes.
* Protect learner routes.
* Add unauthorized/error pages.
* Add seeded admin account.
* Add basic auth rate limiting.
* Add auth tests.

Acceptance Criteria

* Admin can log in.
* Learner can log in.
* Admin can access admin dashboard.
* Learner cannot access admin dashboard.
* Logged-out user cannot access protected routes.
* Password hashes are never stored in plain text.

Milestone 2: Core Data Model

Goal

Implement core database models and CRUD foundations.

Deliverables

* Users
* Groups
* Modules
* Challenges
* Assignments
* Attempts
* Completions
* Audit log

Tasks

* Create Group model.
* Create GroupMembership model.
* Create Module model.
* Create Challenge model.
* Create ModuleChallenge model.
* Create Assignment model.
* Create Attempt model.
* Create Completion model.
* Create ChallengeInstance model.
* Create AuditLog model.
* Add migrations.
* Add seed data.
* Add model-level tests.
* Add database indexes for common queries.

Acceptance Criteria

* Seed data creates sample users, groups, modules, and challenges.
* Database supports assigning modules to users.
* Database supports assigning modules to groups.
* Attempts can be recorded.
* Completion records can be updated.

Milestone 3: Learner Experience V1

Goal

Deliver a usable learner dashboard and module view.

Deliverables

* Learner dashboard
* Assigned module list
* Module detail page
* Markdown rendering
* Challenge section rendering
* Progress status

Tasks

* Create learner dashboard route.
* Query assigned modules for current learner.
* Display module cards.
* Add module status indicators.
* Create module detail route.
* Render module metadata.
* Render Markdown content.
* Add syntax highlighting for code blocks.
* Render linked challenges.
* Show challenge completion state.
* Show module completion state.
* Add responsive layout.
* Add empty state for no assignments.

Acceptance Criteria

* Learner sees assigned modules after login.
* Learner can open a module.
* Markdown content renders correctly.
* Code blocks are readable.
* Learner can see which challenges are incomplete or complete.
* Interface is clean, modern, and responsive.

Milestone 4: Static Challenge System

Goal

Implement basic challenge workflows and validation.

Deliverables

* Static flag challenge
* Multiple choice challenge
* Short answer challenge
* Attempt recording
* Completion updates

Tasks

* Define challenge type enum.
* Implement static flag validator.
* Implement multiple choice validator.
* Implement short answer validator.
* Create challenge display component.
* Create submission API.
* Record attempts.
* Show validation result to learner.
* Update challenge completion.
* Update module completion when requirements are satisfied.
* Add tests for validators.
* Add tests for attempt recording.
* Add tests for completion calculation.

Acceptance Criteria

* Learner can submit a static flag.
* Correct flag marks challenge complete.
* Incorrect flag records attempt without revealing answer.
* Learner can answer multiple-choice challenge.
* Learner can answer short-answer challenge.
* Module completion updates when required challenges are complete.

Milestone 5: Admin Experience V1

Goal

Deliver basic admin management for modules, challenges, users, groups, and assignments.

Deliverables

- [x] Admin dashboard
- [x] User list
- [x] Group list
- [x] Module list
- [x] Challenge list
- [x] Assignment workflow
- [x] Attempt visibility

Tasks

- [x] Create admin dashboard route.
- [x] Create admin navigation.
- [x] Create user list view.
- [x] Create user creation form.
- [x] Create user role edit form.
- [x] Create group list view.
- [x] Create group creation form.
- [x] Create group membership management.
- [x] Create module list view.
- [x] Create module create/edit form.
- [x] Add Markdown editor or textarea for module body.
- [x] Create challenge list view.
- [x] Create challenge create/edit form.
- [x] Associate challenges with modules.
- [x] Create assignment form.
- [x] Assign module to user.
- [x] Assign module to group.
- [x] View attempts by challenge.
- [x] Add audit logging for admin actions.

Acceptance Criteria

- [x] Admin can create a module.
- [x] Admin can create a challenge.
- [x] Admin can associate challenge with module.
- [x] Admin can assign module to learner.
- [x] Admin can assign module to group.
- [x] Admin can view learner attempts.
- [x] Admin actions are recorded in audit log.

Milestone 6: File-Based Challenge Support

Goal

Support challenge attachments for code review, document review, and downloadable artifacts.

Deliverables

- [x] File upload support
- [x] File attachment model
- [x] Learner file download
- [x] Admin attachment management
- [x] File size/type validation

Tasks

- [x] Create file attachment model.
- [x] Add local file storage for v1.
- [x] Add file upload API.
- [x] Add file validation.
- [x] Add admin file attachment UI.
- [x] Add learner download UI.
- [x] Add file cleanup behavior.
- [x] Add security checks for file access.
- [x] Document storage configuration.

Acceptance Criteria

- [x] Admin can attach a file to a challenge.
- [x] Learner can download files for assigned/available challenges.
- [x] Unauthorized users cannot download restricted files.
- [x] File size limits are enforced.
- [x] Unsafe file paths are rejected.

Milestone 7: Dockerized Challenge Runtime V1

Goal

Support launching simple Dockerized web challenges.

Deliverables

* Challenge runner service
* Docker challenge definition support
* Instance lifecycle management
* Port allocation
* Challenge URL generation
* Stop/cleanup process

Tasks

* Define Docker runtime configuration schema.
* Create runner abstraction.
* Implement Docker runner.
* Add worker service.
* Add job queue.
* Implement challenge launch request.
* Implement container creation.
* Implement resource limits.
* Implement port allocation.
* Store challenge instance state.
* Return challenge URL to learner.
* Implement stop challenge.
* Implement instance expiration.
* Implement cleanup job.
* Add runner logs.
* Add error states in learner UI.
* Add admin visibility into running instances.
* Add sample Dockerized challenge.

Acceptance Criteria

* Learner can start a Dockerized web challenge.
* Platform launches a container for the learner.
* Learner receives working URL.
* Learner can stop the challenge.
* Expired challenges are cleaned up.
* Resource limits are applied.
* Failed launches produce useful error messages.
* No privileged containers are launched by default.

Milestone 8: Reporting V1

Goal

Provide basic admin visibility into progress and outcomes.

Deliverables

* Completion report
* Module progress report
* Challenge attempt report
* CSV export

Tasks

* Create reports dashboard.
* Add module completion report.
* Add learner completion report.
* Add challenge attempt report.
* Add filtering by module.
* Add filtering by learner.
* Add filtering by group.
* Add CSV export for completions.
* Add CSV export for attempts.

Acceptance Criteria

* Admin can see who completed each module.
* Admin can see learner progress across modules.
* Admin can see challenge success/failure counts.
* Admin can export completion data to CSV.
* Admin can export attempt data to CSV.

Milestone 9: Content Import V1

Goal

Support structured import of modules and challenges from local content files.

Deliverables

* YAML/JSON module schema
* YAML/JSON challenge schema
* Import command
* Schema validation
* Example content

Tasks

* Define module schema.
* Define challenge schema.
* Add schema validation.
* Create content import CLI/script.
* Import Markdown lesson content.
* Import challenge definitions.
* Link modules to challenges.
* Detect duplicate slugs.
* Add dry-run mode.
* Add example module.
* Add example challenge.
* Document content format.

Acceptance Criteria

* Developer can import a module from local files.
* Developer can import challenges from local files.
* Invalid content fails with useful errors.
* Imported module appears in admin UI.
* Imported module can be assigned to a learner.

Milestone 10: Hardening and Developer Experience

Goal

Make the project stable enough for internal testing.

Deliverables

* Improved docs
* Better tests
* Security baseline
* Error handling
* Operational runbook
* Demo content
* Versioned release

Tasks

* Add architecture documentation.
* Add security model documentation.
* Add challenge runtime documentation.
* Add admin usage documentation.
* Add learner usage documentation.
* Add Docker deployment documentation.
* Add backup/restore notes.
* Add test coverage for core flows.
* Add API integration tests.
* Add UI smoke tests.
* Add dependency scanning.
* Add container scanning.
* Add secret scanning.
* Add structured logging.
* Add global error handling.
* Add release tagging.
* Create v0.1.0 release.

Acceptance Criteria

* New developer can run the platform from README instructions.
* Core flows are covered by tests.
* Basic security checks run in CI.
* Platform can be demoed locally with seeded content.
* v0.1.0 release is tagged.

12. Future Roadmap

12.1 Version 0.2

Potential scope:

* OIDC authentication
* Git-backed content import
* Dynamic flags
* Module versioning
* Better reporting
* Skill/tag matrix
* Admin authoring improvements
* Improved challenge lifecycle controls

12.2 Version 0.3

Potential scope:

* Detection engineering challenges
* Patch-the-code challenges
* Unit test validators
* Manual review workflows
* Team assignments
* Due dates and reminders
* S3-compatible file storage
* Webhook events

12.3 Version 1.0

Potential scope:

* Stable module/challenge schema
* Production deployment guide
* Hardened Docker runner
* SSO/OIDC
* Advanced RBAC
* Audit log UI
* Compliance exports
* Backup/restore tooling
* Observability integration
* Admin-friendly content workflows

13. Out of Scope for Initial Version

The following are explicitly out of scope for v1 unless later reprioritized:

* Complete content curriculum
* Public SaaS multi-tenancy
* Payment/billing
* Marketplace for modules
* Kubernetes-native challenge orchestration
* Full LMS replacement
* SCORM/xAPI support
* Advanced gamification
* Public leaderboard-first competition mode
* AI-generated training content
* Browser-based IDE
* Full malware analysis sandbox
* Arbitrary untrusted code execution without containment improvements

14. Security Considerations for Challenge Runtime

Dockerized challenges create additional security risk.

V1 must follow these rules:

* Do not run challenge containers as privileged.
* Do not mount the host Docker socket into learner-accessible containers.
* Apply memory limits.
* Apply CPU limits.
* Use isolated Docker networks where practical.
* Avoid host filesystem mounts.
* Use read-only filesystems where possible.
* Clean up expired containers.
* Log container lifecycle events.
* Treat all challenge containers as potentially hostile.
* Keep runner service separate from learner-facing app logic where practical.

Future runtime hardening:

* Per-user network isolation
* Egress restrictions
* Image allowlists
* Image signing
* Rootless Docker
* gVisor
* Firecracker
* Kubernetes namespaces
* Runtime policy enforcement
* Dedicated challenge worker nodes

15. Definition of Done

A feature is done when:

* Code is implemented.
* Tests are added or updated.
* Linting passes.
* Type checks pass.
* Database migrations are included, if needed.
* UI states are handled.
* Error states are handled.
* Access control is enforced server-side.
* Documentation is updated.
* Feature works through Docker Compose.
* No secrets are committed.
* Security implications have been considered.

16. MVP Definition

The MVP is complete when:

* Admin can log in.
* Learner can log in.
* Admin can create users.
* Admin can create modules.
* Admin can create static challenges.
* Admin can assign modules to learners.
* Learner can view assigned modules.
* Learner can read Markdown lesson content.
* Learner can submit answers to challenges.
* Platform records attempts.
* Platform records completions.
* Admin can view progress.
* Admin can export completion data.
* Application runs through Docker Compose.
* Basic Dockerized challenge support works for at least one sample web challenge.

17. Initial Sample Content for Testing Only

Although content is not the primary project scope, the repo should include minimal sample content for testing.

Sample modules:

* intro-static-flag
* intro-secure-code-review
* intro-docker-web-lab

Sample challenges:

* Static flag challenge
* Multiple-choice challenge
* Short-answer challenge
* File-based code review challenge
* Simple Dockerized web challenge

These should be clearly marked as demo/test content and not presented as a real curriculum.

18. Suggested Initial README Tagline

hackd is a containerized control plane for hands-on security training modules, challenges, sandboxes, validation, and learner progress.

19. Suggested Repo Description

Security training platform runtime for modules, challenges, sandboxes, validation, and learner progress.

20. Initial Development Command Targets

The project should eventually support:

docker compose up
npm run dev
npm run lint
npm run test
npm run build
npm run db:migrate
npm run db:seed
npm run content:import
npm run runner:cleanup

21. Open Decisions

The following decisions should be made early:

* Use Next.js full-stack or separate frontend/backend?
* Use Prisma, Drizzle, SQLAlchemy, or another ORM?
* Use NextAuth/Auth.js, custom auth, or another auth library?
* Use shadcn/ui, Mantine, Chakra, or custom components?
* Store content in database first, file-based first, or hybrid?
* Store uploaded files locally for v1 or use S3-compatible storage?
* Run Docker challenges from app worker or separate runner service?
* Support OIDC in v1 or defer?
* Support dark mode in v1 or defer?
* Support dynamic flags in v1 or defer?
* Support Git-backed module import in v1 or defer?

22. Recommended Initial Decisions

Recommended defaults for v1:

* Framework: Next.js
* Language: TypeScript
* Styling: Tailwind CSS
* Components: shadcn/ui
* Database: Postgres
* ORM: Prisma
* Queue: Redis + BullMQ
* Runtime: Docker
* Auth: Local auth for v1, OIDC later
* Content: Database-backed modules with YAML/Markdown import
* Deployment: Docker Compose
* Testing: Vitest + Playwright
* CI: GitHub Actions

23. First Build Sequence

Recommended implementation order:

1. Bootstrap app and Docker Compose.
2. Add database schema and seed data.
3. Add local auth and RBAC.
4. Build learner dashboard.
5. Build module rendering.
6. Build static challenge validation.
7. Build admin CRUD.
8. Build assignments.
9. Build completion tracking.
10. Build reporting.
11. Add file-based challenges.
12. Add Dockerized challenge runtime.
13. Add content import.
14. Harden, document, and tag v0.1.0.
