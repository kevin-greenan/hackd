import { ChallengeType, ContentStatus, Prisma, Role, UserStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  hashPassword: vi.fn(),
  transaction: vi.fn(),
  userCreate: vi.fn(),
  userUpdate: vi.fn(),
  groupMembershipDeleteMany: vi.fn(),
  groupMembershipCreate: vi.fn(),
  groupCreate: vi.fn(),
  groupUpdate: vi.fn(),
  groupFindUnique: vi.fn(),
  groupDelete: vi.fn(),
  moduleCreate: vi.fn(),
  moduleUpdate: vi.fn(),
  challengeCreate: vi.fn(),
  challengeUpdate: vi.fn(),
  moduleChallengeUpsert: vi.fn(),
  auditLogCreate: vi.fn()
}));

vi.mock("@/lib/auth/password", () => ({
  hashPassword: mocks.hashPassword
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    user: {
      create: mocks.userCreate,
      update: mocks.userUpdate
    },
    groupMembership: {
      deleteMany: mocks.groupMembershipDeleteMany,
      create: mocks.groupMembershipCreate
    },
    group: {
      create: mocks.groupCreate,
      update: mocks.groupUpdate,
      findUnique: mocks.groupFindUnique,
      delete: mocks.groupDelete
    },
    module: {
      create: mocks.moduleCreate,
      update: mocks.moduleUpdate
    },
    challenge: {
      create: mocks.challengeCreate,
      update: mocks.challengeUpdate
    },
    moduleChallenge: {
      upsert: mocks.moduleChallengeUpsert
    },
    auditLog: {
      create: mocks.auditLogCreate
    }
  }
}));

const {
  createAdminChallenge,
  createAdminModule,
  createAdminUser,
  deleteAdminGroup,
  updateAdminUser,
  upsertAdminModuleChallenge
} = await import("@/lib/core/admin-management");

describe("admin management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hashPassword.mockResolvedValue("hashed-password");
    mocks.transaction.mockResolvedValue([]);
    mocks.groupMembershipCreate.mockReturnValue({});
    mocks.groupMembershipDeleteMany.mockReturnValue({});
  });

  it("creates users with a hashed password and audit log", async () => {
    mocks.userCreate.mockResolvedValue({
      id: "user-1",
      email: "learner@example.com",
      role: Role.LEARNER,
      status: UserStatus.ACTIVE
    });

    await createAdminUser({
      actorUserId: "admin-1",
      input: {
        name: "New Learner",
        email: "Learner@Example.com",
        password: "long-enough-password",
        role: Role.LEARNER,
        status: UserStatus.ACTIVE,
        groupIds: ["group-1"]
      }
    });

    expect(mocks.hashPassword).toHaveBeenCalledWith("long-enough-password");
    expect(mocks.userCreate).toHaveBeenCalledWith({
      data: {
        name: "New Learner",
        email: "learner@example.com",
        passwordHash: "hashed-password",
        role: Role.LEARNER,
        status: UserStatus.ACTIVE,
        groupMemberships: {
          create: [{ groupId: "group-1" }]
        }
      }
    });
    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: {
        actorUserId: "admin-1",
        action: "admin.user.create",
        targetType: "user",
        targetId: "user-1",
        metadata: {
          email: "learner@example.com",
          role: Role.LEARNER,
          status: UserStatus.ACTIVE
        }
      }
    });
  });

  it("prevents an admin from disabling their own account", async () => {
    await expect(
      updateAdminUser({
        actorUserId: "admin-1",
        input: {
          userId: "admin-1",
          name: "Admin",
          role: Role.ADMIN,
          status: UserStatus.DISABLED,
          groupIds: []
        }
      })
    ).rejects.toThrow("Admins cannot disable their own active session account.");

    expect(mocks.userUpdate).not.toHaveBeenCalled();
  });

  it("rejects deleting groups that still have members or assignments", async () => {
    mocks.groupFindUnique.mockResolvedValue({
      id: "group-1",
      slug: "appsec",
      _count: {
        memberships: 1,
        assignments: 0
      }
    });

    await expect(
      deleteAdminGroup({
        actorUserId: "admin-1",
        groupId: "group-1"
      })
    ).rejects.toThrow("Only groups without assignments or members can be deleted.");

    expect(mocks.groupDelete).not.toHaveBeenCalled();
  });

  it("creates modules with parsed tags and audit log metadata", async () => {
    mocks.moduleCreate.mockResolvedValue({
      id: "module-1",
      slug: "secure-review",
      status: ContentStatus.DRAFT
    });

    await createAdminModule({
      actorUserId: "admin-1",
      input: {
        title: "Secure Review",
        slug: "secure-review",
        summary: "A useful sample module.",
        bodyMarkdown: "## Lesson",
        difficulty: "beginner",
        estimatedMinutes: "30",
        status: ContentStatus.DRAFT,
        tags: "appsec, review"
      }
    });

    expect(mocks.moduleCreate).toHaveBeenCalledWith({
      data: {
        title: "Secure Review",
        slug: "secure-review",
        summary: "A useful sample module.",
        bodyMarkdown: "## Lesson",
        difficulty: "beginner",
        estimatedMinutes: 30,
        status: ContentStatus.DRAFT,
        tags: ["appsec", "review"],
        createdById: "admin-1"
      }
    });
    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: {
        actorUserId: "admin-1",
        action: "admin.module.create",
        targetType: "module",
        targetId: "module-1",
        metadata: {
          slug: "secure-review",
          status: ContentStatus.DRAFT
        }
      }
    });
  });

  it("creates challenges with parsed JSON validation config", async () => {
    mocks.challengeCreate.mockResolvedValue({
      id: "challenge-1",
      slug: "first-flag",
      type: ChallengeType.STATIC_FLAG,
      status: ContentStatus.PUBLISHED
    });

    await createAdminChallenge({
      actorUserId: "admin-1",
      input: {
        title: "First Flag",
        slug: "first-flag",
        description: "Submit the sample flag.",
        type: ChallengeType.STATIC_FLAG,
        difficulty: "beginner",
        points: "25",
        status: ContentStatus.PUBLISHED,
        tags: "platform",
        validationConfig: "{\"type\":\"static_flag\",\"flag\":\"flag{sample}\"}",
        runtimeConfig: ""
      }
    });

    expect(mocks.challengeCreate).toHaveBeenCalledWith({
      data: {
        title: "First Flag",
        slug: "first-flag",
        description: "Submit the sample flag.",
        type: ChallengeType.STATIC_FLAG,
        difficulty: "beginner",
        points: 25,
        status: ContentStatus.PUBLISHED,
        tags: ["platform"],
        validationConfig: { type: "static_flag", flag: "flag{sample}" },
        runtimeConfig: Prisma.DbNull,
        createdById: "admin-1"
      }
    });
  });

  it("upserts module challenge associations and logs the link", async () => {
    mocks.moduleChallengeUpsert.mockResolvedValue({
      id: "module-challenge-1",
      moduleId: "module-1",
      challengeId: "challenge-1",
      required: true,
      sortOrder: 2
    });

    await upsertAdminModuleChallenge({
      actorUserId: "admin-1",
      input: {
        moduleId: "module-1",
        challengeId: "challenge-1",
        required: true,
        sortOrder: "2"
      }
    });

    expect(mocks.moduleChallengeUpsert).toHaveBeenCalledWith({
      where: {
        moduleId_challengeId: {
          moduleId: "module-1",
          challengeId: "challenge-1"
        }
      },
      update: {
        sortOrder: 2,
        required: true
      },
      create: {
        moduleId: "module-1",
        challengeId: "challenge-1",
        sortOrder: 2,
        required: true
      }
    });
    expect(mocks.auditLogCreate).toHaveBeenCalledWith({
      data: {
        actorUserId: "admin-1",
        action: "admin.module_challenge.upsert",
        targetType: "module_challenge",
        targetId: "module-challenge-1",
        metadata: {
          moduleId: "module-1",
          challengeId: "challenge-1",
          required: true,
          sortOrder: 2
        }
      }
    });
  });
});
