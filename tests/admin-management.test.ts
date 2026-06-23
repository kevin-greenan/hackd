import { Role, UserStatus } from "@prisma/client";
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
    auditLog: {
      create: mocks.auditLogCreate
    }
  }
}));

const {
  createAdminUser,
  deleteAdminGroup,
  updateAdminUser
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
});
