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
        "## Overview\n\nThis sample module exists to exercise assignment and completion data paths.\n\n### What you will see\n\n- A linked challenge section\n- Attempt history reflected in recent activity\n- Module progress state on the dashboard\n\n```txt\nflag{sample}\n```\n\nSubmit the sample flag to complete the required challenge.",
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
        "## Overview\n\nThis sample module exists to exercise assignment and completion data paths.\n\n### What you will see\n\n- A linked challenge section\n- Attempt history reflected in recent activity\n- Module progress state on the dashboard\n\n```txt\nflag{sample}\n```\n\nSubmit the sample flag to complete the required challenge.",
      difficulty: "beginner",
      estimatedMinutes: 20,
      status: ContentStatus.PUBLISHED,
      tags: ["platform", "challenge-basics"],
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

  await upsertSeedAssignment({
    moduleId: secureCodeReview.id,
    assignedById: admin.id,
    target: { groupId: appsecGroup.id },
    dueAt: new Date("2026-08-01T05:00:00.000Z"),
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
