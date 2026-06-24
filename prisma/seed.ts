import {
  AssignmentStatus,
  AttemptResult,
  ChallengeType,
  ContentStatus,
  Prisma,
  PrismaClient,
  Role,
  UserStatus
} from "@prisma/client";
import { hashPassword } from "../lib/auth/password";
import { upsertSeedAssignment } from "../lib/core/assignments";

const prisma = new PrismaClient();

async function seedUser({
  email,
  password,
  name,
  role
}: {
  email: string;
  password: string;
  name: string;
  role: Role;
}) {
  if (password.length < 12) {
    throw new Error(`${role} seed password must be at least 12 characters.`);
  }

  const normalizedEmail = email.toLowerCase();

  const passwordHash = await hashPassword(password);

  return prisma.user.upsert({
    where: { email: normalizedEmail },
    update: {
      passwordHash,
      role,
      status: UserStatus.ACTIVE
    },
    create: {
      email: normalizedEmail,
      name,
      passwordHash,
      role,
      status: UserStatus.ACTIVE
    }
  });
}

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const learnerEmail = process.env.SEED_LEARNER_EMAIL;
  const learnerPassword = process.env.SEED_LEARNER_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required.");
  }

  if (!learnerEmail || !learnerPassword) {
    throw new Error("SEED_LEARNER_EMAIL and SEED_LEARNER_PASSWORD are required.");
  }

  const admin = await seedUser({
    email: adminEmail,
    password: adminPassword,
    name: "hackd Admin",
    role: Role.ADMIN
  });
  const learner = await seedUser({
    email: learnerEmail,
    password: learnerPassword,
    name: "hackd Learner",
    role: Role.LEARNER
  });

  const appsecGroup = await prisma.group.upsert({
    where: { slug: "appsec-learners" },
    update: {
      name: "AppSec Learners",
      description: "Sample learner group for local development."
    },
    create: {
      name: "AppSec Learners",
      slug: "appsec-learners",
      description: "Sample learner group for local development."
    }
  });

  await prisma.groupMembership.upsert({
    where: {
      userId_groupId: {
        userId: learner.id,
        groupId: appsecGroup.id
      }
    },
    update: {},
    create: {
      userId: learner.id,
      groupId: appsecGroup.id
    }
  });

  const secureCodeReview = await prisma.module.upsert({
    where: { slug: "intro-secure-code-review" },
    update: {
      title: "Intro to Secure Code Review",
      summary: "Learn a practical review loop for spotting common web security defects.",
      bodyMarkdown:
        "## Overview\n\nThis sample module introduces structured secure code review for web applications.\n\n### Review loop\n\n1. Identify trust boundaries.\n2. Trace user-controlled input.\n3. Confirm authorization checks near sensitive reads and writes.\n\n```ts\nif (invoice.userId !== currentUser.id) {\n  throw new Error(\"not authorized\");\n}\n```\n\n> Secure review is most useful when it is repeatable and specific.",
      difficulty: "beginner",
      estimatedMinutes: 35,
      status: ContentStatus.PUBLISHED,
      tags: ["appsec", "code-review"],
      createdById: admin.id
    },
    create: {
      title: "Intro to Secure Code Review",
      slug: "intro-secure-code-review",
      summary: "Learn a practical review loop for spotting common web security defects.",
      bodyMarkdown:
        "## Overview\n\nThis sample module introduces structured secure code review for web applications.\n\n### Review loop\n\n1. Identify trust boundaries.\n2. Trace user-controlled input.\n3. Confirm authorization checks near sensitive reads and writes.\n\n```ts\nif (invoice.userId !== currentUser.id) {\n  throw new Error(\"not authorized\");\n}\n```\n\n> Secure review is most useful when it is repeatable and specific.",
      difficulty: "beginner",
      estimatedMinutes: 35,
      status: ContentStatus.PUBLISHED,
      tags: ["appsec", "code-review"],
      createdById: admin.id
    }
  });

  const staticFlagModule = await prisma.module.upsert({
    where: { slug: "intro-static-flag" },
    update: {
      title: "Intro Static Flag",
      summary: "Practice a simple challenge submission workflow with a static flag.",
      bodyMarkdown:
        "## Overview\n\nThis sample module exists to exercise assignment and completion data paths.\n\n### What you will see\n\n- A linked challenge section\n- Attempt history reflected in recent activity\n- Module progress state on the dashboard\n\nUse this module to confirm the submission workflow without exposing the expected answer in the lesson body.",
      difficulty: "beginner",
      estimatedMinutes: 20,
      status: ContentStatus.PUBLISHED,
      tags: ["platform", "challenge-basics"],
      createdById: admin.id
    },
    create: {
      title: "Intro Static Flag",
      slug: "intro-static-flag",
      summary: "Practice a simple challenge submission workflow with a static flag.",
      bodyMarkdown:
        "## Overview\n\nThis sample module exists to exercise assignment and completion data paths.\n\n### What you will see\n\n- A linked challenge section\n- Attempt history reflected in recent activity\n- Module progress state on the dashboard\n\nUse this module to confirm the submission workflow without exposing the expected answer in the lesson body.",
      difficulty: "beginner",
      estimatedMinutes: 20,
      status: ContentStatus.PUBLISHED,
      tags: ["platform", "challenge-basics"],
      createdById: admin.id
    }
  });

  const practitionerChallengeBody = [
    "## Overview",
    "This module is a focused challenge set for realistic web application security review. Each exercise asks you to read a small scenario, identify the security decision that matters, and submit either a derived static flag or the best multiple-choice answer.",
    "### Static flag format",
    "For static-flag exercises in this module, do not look for a printed flag. Derive the review action from the scenario, normalize it to lowercase snake_case, and submit it as `flag{normalized_action}`.",
    "### Scenario A: Password storage review",
    "A pull request replaces a legacy `sha256(password)` helper with a password hashing abstraction. During review, you should confirm the implementation uses a password hashing algorithm designed for offline attack resistance, stores a unique salt with each password hash, and can increase cost over time.",
    "### Scenario B: Authorization boundary review",
    "A profile update endpoint accepts a route parameter and request body from the browser:",
    "```ts\nexport async function updateProfile(request: Request, profileId: string) {\n  const body = await request.json();\n  const profile = await db.profile.findUnique({ where: { id: profileId } });\n\n  if (!profile) {\n    throw new Error(\"not found\");\n  }\n\n  // Review task: identify the missing ownership control before this update.\n  return db.profile.update({\n    where: { id: profile.id },\n    data: { displayName: body.displayName }\n  });\n}\n```",
    "Derive the static flag from the action you would require before allowing the update.",
    "### Scenario C: Logging review",
    "An incident-response dashboard ingests request metadata. One trace includes a raw password-reset token in an application log:",
    "```txt\n2026-06-24T00:00:00Z password_reset requested user=alex@example.test token=raw-reset-token-7f2a\n```",
    "A safe implementation must avoid storing raw reset tokens, session cookies, API keys, or credentials in logs. Derive the static flag from the action that should happen before sensitive data is persisted to logs.",
    "### Scenario D: Token rotation drill",
    "A teammate finds a token committed to a temporary troubleshooting script. Deleting the line from Git does not make the exposed secret safe. Derive the static flag from the incident-response action required for the exposed token.",
    "### Scenario E: Runtime guardrails",
    "A Dockerized challenge image should be treated as untrusted until proven otherwise. Keep the web application away from the Docker socket, require an image allowlist, avoid privileged containers, drop Linux capabilities, apply CPU/memory/PID limits, and prefer read-only filesystems with tightly scoped writable temp paths."
  ].join("\n\n");

  const practitionerChallengeModule = await prisma.module.upsert({
    where: { slug: "web-security-practitioner-challenges" },
    update: {
      title: "Web Security Practitioner Challenges",
      summary:
        "Practice focused AppSec decisions across authentication, authorization, logging, CSRF, and runtime hardening.",
      bodyMarkdown: practitionerChallengeBody,
      difficulty: "intermediate",
      estimatedMinutes: 45,
      status: ContentStatus.PUBLISHED,
      tags: ["appsec", "security-review", "runtime"],
      createdById: admin.id
    },
    create: {
      title: "Web Security Practitioner Challenges",
      slug: "web-security-practitioner-challenges",
      summary:
        "Practice focused AppSec decisions across authentication, authorization, logging, CSRF, and runtime hardening.",
      bodyMarkdown: practitionerChallengeBody,
      difficulty: "intermediate",
      estimatedMinutes: 45,
      status: ContentStatus.PUBLISHED,
      tags: ["appsec", "security-review", "runtime"],
      createdById: admin.id
    }
  });

  const reviewChallenge = await prisma.challenge.upsert({
    where: { slug: "spot-insecure-direct-object-reference" },
    update: {
      title: "Spot an IDOR",
      description: "Review a short scenario and identify the authorization flaw.",
      type: ChallengeType.SHORT_ANSWER,
      difficulty: "beginner",
      points: 50,
      tags: ["appsec", "authorization"],
      validationConfig: {
        type: "exact_text",
        acceptedAnswers: ["idor", "insecure direct object reference"],
        caseInsensitive: true
      },
      status: ContentStatus.PUBLISHED,
      createdById: admin.id
    },
    create: {
      title: "Spot an IDOR",
      slug: "spot-insecure-direct-object-reference",
      description: "Review a short scenario and identify the authorization flaw.",
      type: ChallengeType.SHORT_ANSWER,
      difficulty: "beginner",
      points: 50,
      tags: ["appsec", "authorization"],
      validationConfig: {
        type: "exact_text",
        acceptedAnswers: ["idor", "insecure direct object reference"],
        caseInsensitive: true
      },
      status: ContentStatus.PUBLISHED,
      createdById: admin.id
    }
  });

  const flagChallenge = await prisma.challenge.upsert({
    where: { slug: "submit-your-first-flag" },
    update: {
      title: "Submit Your First Flag",
      description: "Use the platform flow to submit a sample static flag.",
      type: ChallengeType.STATIC_FLAG,
      difficulty: "beginner",
      points: 25,
      tags: ["platform"],
      validationConfig: {
        type: "static_flag",
        flag: "flag{sample}"
      },
      status: ContentStatus.PUBLISHED,
      createdById: admin.id
    },
    create: {
      title: "Submit Your First Flag",
      slug: "submit-your-first-flag",
      description: "Use the platform flow to submit a sample static flag.",
      type: ChallengeType.STATIC_FLAG,
      difficulty: "beginner",
      points: 25,
      tags: ["platform"],
      validationConfig: {
        type: "static_flag",
        flag: "flag{sample}"
      },
      status: ContentStatus.PUBLISHED,
      createdById: admin.id
    }
  });

  const trustBoundaryChallenge = await prisma.challenge.upsert({
    where: { slug: "identify-trust-boundaries" },
    update: {
      title: "Identify Trust Boundaries",
      description: "Select the inputs that should be treated as untrusted in a web request.",
      type: ChallengeType.MULTIPLE_CHOICE,
      difficulty: "beginner",
      points: 25,
      tags: ["appsec", "fundamentals"],
      validationConfig: {
        type: "multiple_choice",
        allowMultiple: true,
        options: [
          { id: "query", label: "Query string parameters" },
          { id: "headers", label: "HTTP request headers" },
          { id: "server-config", label: "Server-side configuration constants" }
        ],
        correctOptionIds: ["query", "headers"]
      },
      status: ContentStatus.PUBLISHED,
      createdById: admin.id
    },
    create: {
      title: "Identify Trust Boundaries",
      slug: "identify-trust-boundaries",
      description: "Select the inputs that should be treated as untrusted in a web request.",
      type: ChallengeType.MULTIPLE_CHOICE,
      difficulty: "beginner",
      points: 25,
      tags: ["appsec", "fundamentals"],
      validationConfig: {
        type: "multiple_choice",
        allowMultiple: true,
        options: [
          { id: "query", label: "Query string parameters" },
          { id: "headers", label: "HTTP request headers" },
          { id: "server-config", label: "Server-side configuration constants" }
        ],
        correctOptionIds: ["query", "headers"]
      },
      status: ContentStatus.PUBLISHED,
      createdById: admin.id
    }
  });

  const authzBoundaryFlagChallenge = await prisma.challenge.upsert({
    where: { slug: "authz-boundary-review-flag" },
    update: {
      title: "Authorization Boundary Review",
      description:
        "Read Scenario B and submit the flag tied to the missing server-side ownership check.",
      type: ChallengeType.STATIC_FLAG,
      difficulty: "intermediate",
      points: 50,
      tags: ["appsec", "authorization", "code-review"],
      validationConfig: {
        type: "static_flag",
        flag: "flag{check_owner_before_update}"
      },
      status: ContentStatus.PUBLISHED,
      createdById: admin.id
    },
    create: {
      title: "Authorization Boundary Review",
      slug: "authz-boundary-review-flag",
      description:
        "Read Scenario B and submit the flag tied to the missing server-side ownership check.",
      type: ChallengeType.STATIC_FLAG,
      difficulty: "intermediate",
      points: 50,
      tags: ["appsec", "authorization", "code-review"],
      validationConfig: {
        type: "static_flag",
        flag: "flag{check_owner_before_update}"
      },
      status: ContentStatus.PUBLISHED,
      createdById: admin.id
    }
  });

  const loggingRedactionFlagChallenge = await prisma.challenge.upsert({
    where: { slug: "logging-redaction-review-flag" },
    update: {
      title: "Logging Redaction Review",
      description: "Read Scenario C and submit the flag associated with safe log handling.",
      type: ChallengeType.STATIC_FLAG,
      difficulty: "beginner",
      points: 40,
      tags: ["appsec", "logging", "incident-response"],
      validationConfig: {
        type: "static_flag",
        flag: "flag{redact_before_logging}"
      },
      status: ContentStatus.PUBLISHED,
      createdById: admin.id
    },
    create: {
      title: "Logging Redaction Review",
      slug: "logging-redaction-review-flag",
      description: "Read Scenario C and submit the flag associated with safe log handling.",
      type: ChallengeType.STATIC_FLAG,
      difficulty: "beginner",
      points: 40,
      tags: ["appsec", "logging", "incident-response"],
      validationConfig: {
        type: "static_flag",
        flag: "flag{redact_before_logging}"
      },
      status: ContentStatus.PUBLISHED,
      createdById: admin.id
    }
  });

  const tokenRotationFlagChallenge = await prisma.challenge.upsert({
    where: { slug: "exposed-token-rotation-flag" },
    update: {
      title: "Exposed Token Rotation",
      description: "Read Scenario D and submit the flag for the correct secret-response action.",
      type: ChallengeType.STATIC_FLAG,
      difficulty: "beginner",
      points: 40,
      tags: ["appsec", "secrets", "incident-response"],
      validationConfig: {
        type: "static_flag",
        flag: "flag{rotate_exposed_token}"
      },
      status: ContentStatus.PUBLISHED,
      createdById: admin.id
    },
    create: {
      title: "Exposed Token Rotation",
      slug: "exposed-token-rotation-flag",
      description: "Read Scenario D and submit the flag for the correct secret-response action.",
      type: ChallengeType.STATIC_FLAG,
      difficulty: "beginner",
      points: 40,
      tags: ["appsec", "secrets", "incident-response"],
      validationConfig: {
        type: "static_flag",
        flag: "flag{rotate_exposed_token}"
      },
      status: ContentStatus.PUBLISHED,
      createdById: admin.id
    }
  });

  const passwordStorageChoiceChallenge = await prisma.challenge.upsert({
    where: { slug: "password-storage-review-choice" },
    update: {
      title: "Password Storage Review",
      description: "Choose the safest password-storage requirement for Scenario A.",
      type: ChallengeType.MULTIPLE_CHOICE,
      difficulty: "beginner",
      points: 35,
      tags: ["appsec", "authentication", "passwords"],
      validationConfig: {
        type: "multiple_choice",
        allowMultiple: false,
        options: [
          { id: "fast-hash", label: "Use a fast hash such as SHA-256 so login is efficient." },
          {
            id: "password-hash",
            label:
              "Use a password hashing algorithm with unique salts and a tunable work factor."
          },
          { id: "encrypt-password", label: "Encrypt passwords so support staff can recover them." }
        ],
        correctOptionIds: ["password-hash"]
      },
      status: ContentStatus.PUBLISHED,
      createdById: admin.id
    },
    create: {
      title: "Password Storage Review",
      slug: "password-storage-review-choice",
      description: "Choose the safest password-storage requirement for Scenario A.",
      type: ChallengeType.MULTIPLE_CHOICE,
      difficulty: "beginner",
      points: 35,
      tags: ["appsec", "authentication", "passwords"],
      validationConfig: {
        type: "multiple_choice",
        allowMultiple: false,
        options: [
          { id: "fast-hash", label: "Use a fast hash such as SHA-256 so login is efficient." },
          {
            id: "password-hash",
            label:
              "Use a password hashing algorithm with unique salts and a tunable work factor."
          },
          { id: "encrypt-password", label: "Encrypt passwords so support staff can recover them." }
        ],
        correctOptionIds: ["password-hash"]
      },
      status: ContentStatus.PUBLISHED,
      createdById: admin.id
    }
  });

  const csrfCoverageChoiceChallenge = await prisma.challenge.upsert({
    where: { slug: "csrf-coverage-review-choice" },
    update: {
      title: "CSRF Coverage Review",
      description: "Select the controls that belong on authenticated state-changing routes.",
      type: ChallengeType.MULTIPLE_CHOICE,
      difficulty: "intermediate",
      points: 45,
      tags: ["appsec", "csrf", "session-security"],
      validationConfig: {
        type: "multiple_choice",
        allowMultiple: true,
        options: [
          { id: "signed-token", label: "Require a signed CSRF token on POST mutations." },
          { id: "session-binding", label: "Bind authenticated tokens to the active session user." },
          { id: "safe-get", label: "Keep GET routes free of state-changing behavior." },
          { id: "referer-only", label: "Rely only on Referer headers for protection." }
        ],
        correctOptionIds: ["signed-token", "session-binding", "safe-get"]
      },
      status: ContentStatus.PUBLISHED,
      createdById: admin.id
    },
    create: {
      title: "CSRF Coverage Review",
      slug: "csrf-coverage-review-choice",
      description: "Select the controls that belong on authenticated state-changing routes.",
      type: ChallengeType.MULTIPLE_CHOICE,
      difficulty: "intermediate",
      points: 45,
      tags: ["appsec", "csrf", "session-security"],
      validationConfig: {
        type: "multiple_choice",
        allowMultiple: true,
        options: [
          { id: "signed-token", label: "Require a signed CSRF token on POST mutations." },
          { id: "session-binding", label: "Bind authenticated tokens to the active session user." },
          { id: "safe-get", label: "Keep GET routes free of state-changing behavior." },
          { id: "referer-only", label: "Rely only on Referer headers for protection." }
        ],
        correctOptionIds: ["signed-token", "session-binding", "safe-get"]
      },
      status: ContentStatus.PUBLISHED,
      createdById: admin.id
    }
  });

  const runtimeGuardrailsChoiceChallenge = await prisma.challenge.upsert({
    where: { slug: "runtime-guardrails-review-choice" },
    update: {
      title: "Runtime Guardrails Review",
      description: "Select the controls that reduce risk for Scenario E challenge containers.",
      type: ChallengeType.MULTIPLE_CHOICE,
      difficulty: "intermediate",
      points: 45,
      tags: ["runtime", "containers", "hardening"],
      validationConfig: {
        type: "multiple_choice",
        allowMultiple: true,
        options: [
          { id: "allowlist", label: "Allow only approved challenge images." },
          { id: "no-privileged", label: "Run without privileged mode and drop Linux capabilities." },
          { id: "limits", label: "Apply CPU, memory, and PID limits." },
          { id: "docker-socket", label: "Mount the host Docker socket into learner containers." }
        ],
        correctOptionIds: ["allowlist", "no-privileged", "limits"]
      },
      status: ContentStatus.PUBLISHED,
      createdById: admin.id
    },
    create: {
      title: "Runtime Guardrails Review",
      slug: "runtime-guardrails-review-choice",
      description: "Select the controls that reduce risk for Scenario E challenge containers.",
      type: ChallengeType.MULTIPLE_CHOICE,
      difficulty: "intermediate",
      points: 45,
      tags: ["runtime", "containers", "hardening"],
      validationConfig: {
        type: "multiple_choice",
        allowMultiple: true,
        options: [
          { id: "allowlist", label: "Allow only approved challenge images." },
          { id: "no-privileged", label: "Run without privileged mode and drop Linux capabilities." },
          { id: "limits", label: "Apply CPU, memory, and PID limits." },
          { id: "docker-socket", label: "Mount the host Docker socket into learner containers." }
        ],
        correctOptionIds: ["allowlist", "no-privileged", "limits"]
      },
      status: ContentStatus.PUBLISHED,
      createdById: admin.id
    }
  });

  const authzPlacementChoiceChallenge = await prisma.challenge.upsert({
    where: { slug: "authorization-check-placement-choice" },
    update: {
      title: "Authorization Check Placement",
      description: "Choose where authorization must be enforced for protected data changes.",
      type: ChallengeType.MULTIPLE_CHOICE,
      difficulty: "beginner",
      points: 35,
      tags: ["appsec", "authorization", "secure-design"],
      validationConfig: {
        type: "multiple_choice",
        allowMultiple: false,
        options: [
          { id: "client", label: "Only hide the edit button in the browser for other users." },
          {
            id: "server",
            label: "Enforce ownership server-side before protected reads and writes."
          },
          { id: "logging", label: "Allow the write but log suspicious profile IDs afterward." }
        ],
        correctOptionIds: ["server"]
      },
      status: ContentStatus.PUBLISHED,
      createdById: admin.id
    },
    create: {
      title: "Authorization Check Placement",
      slug: "authorization-check-placement-choice",
      description: "Choose where authorization must be enforced for protected data changes.",
      type: ChallengeType.MULTIPLE_CHOICE,
      difficulty: "beginner",
      points: 35,
      tags: ["appsec", "authorization", "secure-design"],
      validationConfig: {
        type: "multiple_choice",
        allowMultiple: false,
        options: [
          { id: "client", label: "Only hide the edit button in the browser for other users." },
          {
            id: "server",
            label: "Enforce ownership server-side before protected reads and writes."
          },
          { id: "logging", label: "Allow the write but log suspicious profile IDs afterward." }
        ],
        correctOptionIds: ["server"]
      },
      status: ContentStatus.PUBLISHED,
      createdById: admin.id
    }
  });

  const dockerWebChallenge = await prisma.challenge.upsert({
    where: { slug: "launch-sample-web-runtime" },
    update: {
      title: "Launch Sample Web Runtime",
      description: "Start a temporary Dockerized web challenge and open the generated URL.",
      type: ChallengeType.DOCKER_WEB,
      difficulty: "beginner",
      points: 0,
      tags: ["runtime", "docker"],
      validationConfig: Prisma.JsonNull,
      runtimeConfig: {
        type: "docker_web",
        image: "nginxinc/nginx-unprivileged:alpine",
        containerPort: 8080,
        memoryMb: 128,
        cpuCount: 0.25,
        ttlMinutes: 30
      },
      status: ContentStatus.PUBLISHED,
      createdById: admin.id
    },
    create: {
      title: "Launch Sample Web Runtime",
      slug: "launch-sample-web-runtime",
      description: "Start a temporary Dockerized web challenge and open the generated URL.",
      type: ChallengeType.DOCKER_WEB,
      difficulty: "beginner",
      points: 0,
      tags: ["runtime", "docker"],
      validationConfig: Prisma.JsonNull,
      runtimeConfig: {
        type: "docker_web",
        image: "nginxinc/nginx-unprivileged:alpine",
        containerPort: 8080,
        memoryMb: 128,
        cpuCount: 0.25,
        ttlMinutes: 30
      },
      status: ContentStatus.PUBLISHED,
      createdById: admin.id
    }
  });

  await prisma.moduleChallenge.upsert({
    where: {
      moduleId_challengeId: {
        moduleId: secureCodeReview.id,
        challengeId: reviewChallenge.id
      }
    },
    update: { sortOrder: 1, required: true },
    create: {
      moduleId: secureCodeReview.id,
      challengeId: reviewChallenge.id,
      sortOrder: 1,
      required: true
    }
  });

  await prisma.moduleChallenge.upsert({
    where: {
      moduleId_challengeId: {
        moduleId: staticFlagModule.id,
        challengeId: dockerWebChallenge.id
      }
    },
    update: { sortOrder: 2, required: false },
    create: {
      moduleId: staticFlagModule.id,
      challengeId: dockerWebChallenge.id,
      sortOrder: 2,
      required: false
    }
  });

  await prisma.moduleChallenge.upsert({
    where: {
      moduleId_challengeId: {
        moduleId: staticFlagModule.id,
        challengeId: flagChallenge.id
      }
    },
    update: { sortOrder: 1, required: true },
    create: {
      moduleId: staticFlagModule.id,
      challengeId: flagChallenge.id,
      sortOrder: 1,
      required: true
    }
  });

  await prisma.moduleChallenge.upsert({
    where: {
      moduleId_challengeId: {
        moduleId: secureCodeReview.id,
        challengeId: trustBoundaryChallenge.id
      }
    },
    update: { sortOrder: 2, required: false },
    create: {
      moduleId: secureCodeReview.id,
      challengeId: trustBoundaryChallenge.id,
      sortOrder: 2,
      required: false
    }
  });

  const practitionerChallenges = [
    passwordStorageChoiceChallenge,
    authzPlacementChoiceChallenge,
    authzBoundaryFlagChallenge,
    loggingRedactionFlagChallenge,
    tokenRotationFlagChallenge,
    csrfCoverageChoiceChallenge,
    runtimeGuardrailsChoiceChallenge
  ];

  for (const [index, challenge] of practitionerChallenges.entries()) {
    await prisma.moduleChallenge.upsert({
      where: {
        moduleId_challengeId: {
          moduleId: practitionerChallengeModule.id,
          challengeId: challenge.id
        }
      },
      update: { sortOrder: index + 1, required: true },
      create: {
        moduleId: practitionerChallengeModule.id,
        challengeId: challenge.id,
        sortOrder: index + 1,
        required: true
      }
    });
  }

  await upsertSeedAssignment({
    moduleId: secureCodeReview.id,
    assignedById: admin.id,
    target: { groupId: appsecGroup.id },
    dueAt: new Date("2026-08-01T05:00:00.000Z"),
    required: true
  });

  await upsertSeedAssignment({
    moduleId: practitionerChallengeModule.id,
    assignedById: admin.id,
    target: { groupId: appsecGroup.id },
    dueAt: new Date("2026-08-15T05:00:00.000Z"),
    required: true
  });

  await upsertSeedAssignment({
    moduleId: staticFlagModule.id,
    assignedById: admin.id,
    target: { userId: learner.id },
    dueAt: new Date("2026-07-15T05:00:00.000Z"),
    required: true
  });

  await prisma.completion.upsert({
    where: {
      userId_moduleId: {
        userId: learner.id,
        moduleId: staticFlagModule.id
      }
    },
    update: {
      status: AssignmentStatus.IN_PROGRESS,
      completedAt: null
    },
    create: {
      userId: learner.id,
      moduleId: staticFlagModule.id,
      status: AssignmentStatus.IN_PROGRESS
    }
  });

  const existingAttempt = await prisma.attempt.findFirst({
    where: {
      userId: learner.id,
      challengeId: flagChallenge.id,
      submittedValue: "flag{example}"
    }
  });

  if (!existingAttempt) {
    await prisma.attempt.create({
      data: {
        userId: learner.id,
        challengeId: flagChallenge.id,
        submittedValue: "flag{example}",
        result: AttemptResult.INCORRECT,
        scoreAwarded: 0,
        feedback: "Sample incorrect attempt for local reporting data."
      }
    });
  }

  console.log(`Seeded admin user: ${admin.email}`);
  console.log(`Seeded learner user: ${learner.email}`);
  console.log("Seeded sample group, modules, challenges, assignments, completion, and attempt.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
