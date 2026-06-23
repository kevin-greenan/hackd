import { ChallengeType, ContentStatus, Prisma, Role, UserStatus } from "@prisma/client";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "../db/prisma";
import { assignmentTargetWhere, normalizeAssignmentTarget } from "./assignments";
import { logAdminAction } from "./audit-log";

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const userCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255).transform((email) => email.toLowerCase()),
  password: z.string().min(12).max(200),
  role: z.nativeEnum(Role),
  status: z.nativeEnum(UserStatus),
  groupIds: z.array(z.string()).default([])
});

const userUpdateSchema = z.object({
  userId: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  role: z.nativeEnum(Role),
  status: z.nativeEnum(UserStatus),
  groupIds: z.array(z.string()).default([])
});

const groupCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: slugSchema,
  description: z.string().trim().max(500).optional()
});

const groupUpdateSchema = groupCreateSchema.extend({
  groupId: z.string().min(1)
});

const optionalIntSchema = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? null : Number(value)),
  z.number().int().min(0).nullable()
);

const tagsSchema = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}, z.array(z.string().min(1).max(40)).max(20));

const jsonTextSchema = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return value;
  }

  return JSON.parse(value);
}, z.unknown().nullable());

function toPrismaJson(value: unknown) {
  return value === null ? Prisma.DbNull : (value as Prisma.InputJsonValue);
}

const moduleCreateSchema = z.object({
  title: z.string().trim().min(2).max(160),
  slug: slugSchema,
  summary: z.string().trim().min(10).max(500),
  bodyMarkdown: z.string().trim().min(1).max(20000),
  difficulty: z.string().trim().min(2).max(60),
  estimatedMinutes: optionalIntSchema,
  status: z.nativeEnum(ContentStatus),
  tags: tagsSchema
});

const moduleUpdateSchema = moduleCreateSchema.extend({
  moduleId: z.string().min(1)
});

const challengeCreateSchema = z.object({
  title: z.string().trim().min(2).max(160),
  slug: slugSchema,
  description: z.string().trim().min(5).max(1000),
  type: z.nativeEnum(ChallengeType),
  difficulty: z.string().trim().min(2).max(60),
  points: z.preprocess((value) => Number(value), z.number().int().min(0).max(10000)),
  status: z.nativeEnum(ContentStatus),
  tags: tagsSchema,
  validationConfig: jsonTextSchema,
  runtimeConfig: jsonTextSchema
});

const challengeUpdateSchema = challengeCreateSchema.extend({
  challengeId: z.string().min(1)
});

const moduleChallengeSchema = z.object({
  moduleId: z.string().min(1),
  challengeId: z.string().min(1),
  sortOrder: z.preprocess((value) => Number(value), z.number().int().min(0).max(10000)),
  required: z.boolean()
});

const dueAtSchema = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "string") {
    return new Date(value);
  }

  return value;
}, z.date().nullable());

const assignmentCreateSchema = z.object({
  moduleId: z.string().min(1),
  targetType: z.enum(["user", "group"]),
  targetId: z.string().min(1),
  dueAt: dueAtSchema,
  required: z.boolean()
});

const assignmentUpdateSchema = assignmentCreateSchema.extend({
  assignmentId: z.string().min(1)
});

async function replaceUserGroups(userId: string, groupIds: string[]) {
  const uniqueGroupIds = [...new Set(groupIds)];

  await prisma.$transaction([
    prisma.groupMembership.deleteMany({ where: { userId } }),
    ...uniqueGroupIds.map((groupId) =>
      prisma.groupMembership.create({
        data: {
          userId,
          groupId
        }
      })
    )
  ]);
}

async function userIdsForAssignmentTarget({
  groupId,
  userId
}: {
  groupId: string | null;
  userId: string | null;
}) {
  if (userId) {
    return [userId];
  }

  if (!groupId) {
    return [];
  }

  const memberships = await prisma.groupMembership.findMany({
    where: { groupId },
    select: { userId: true }
  });

  return memberships.map((membership) => membership.userId);
}

async function reconcileCompletionsForRemovedAssignment({
  moduleId,
  targetUserIds
}: {
  moduleId: string;
  targetUserIds: string[];
}) {
  const uniqueUserIds = [...new Set(targetUserIds)];

  if (uniqueUserIds.length === 0) {
    return 0;
  }

  const memberships = await prisma.groupMembership.findMany({
    where: {
      userId: {
        in: uniqueUserIds
      }
    },
    select: {
      groupId: true,
      userId: true
    }
  });
  const groupIdsByUserId = new Map<string, Set<string>>();
  const groupIds = [...new Set(memberships.map((membership) => membership.groupId))];

  memberships.forEach((membership) => {
    const groupIdsForUser = groupIdsByUserId.get(membership.userId) ?? new Set<string>();
    groupIdsForUser.add(membership.groupId);
    groupIdsByUserId.set(membership.userId, groupIdsForUser);
  });

  const remainingAssignments = await prisma.assignment.findMany({
    where: {
      moduleId,
      OR: [
        {
          userId: {
            in: uniqueUserIds
          }
        },
        ...(groupIds.length > 0
          ? [
              {
                groupId: {
                  in: groupIds
                }
              }
            ]
          : [])
      ]
    },
    select: {
      groupId: true,
      userId: true
    }
  });
  const stillAssignedUserIds = new Set<string>();

  remainingAssignments.forEach((assignment) => {
    if (assignment.userId && uniqueUserIds.includes(assignment.userId)) {
      stillAssignedUserIds.add(assignment.userId);
    }

    if (assignment.groupId) {
      uniqueUserIds.forEach((userId) => {
        if (groupIdsByUserId.get(userId)?.has(assignment.groupId as string)) {
          stillAssignedUserIds.add(userId);
        }
      });
    }
  });

  const staleUserIds = uniqueUserIds.filter((userId) => !stillAssignedUserIds.has(userId));

  if (staleUserIds.length === 0) {
    return 0;
  }

  const result = await prisma.completion.deleteMany({
    where: {
      moduleId,
      userId: {
        in: staleUserIds
      }
    }
  });

  return result.count;
}

export async function createAdminUser({
  actorUserId,
  input
}: {
  actorUserId: string;
  input: unknown;
}) {
  const data = userCreateSchema.parse(input);
  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      status: data.status,
      groupMemberships: {
        create: [...new Set(data.groupIds)].map((groupId) => ({
          groupId
        }))
      }
    }
  });

  await logAdminAction({
    actorUserId,
    action: "admin.user.create",
    targetType: "user",
    targetId: user.id,
    metadata: {
      email: user.email,
      role: user.role,
      status: user.status
    }
  });

  return user;
}

export async function updateAdminUser({
  actorUserId,
  input
}: {
  actorUserId: string;
  input: unknown;
}) {
  const data = userUpdateSchema.parse(input);

  if (data.userId === actorUserId && data.status !== UserStatus.ACTIVE) {
    throw new Error("Admins cannot disable their own active session account.");
  }

  const user = await prisma.user.update({
    where: { id: data.userId },
    data: {
      name: data.name,
      role: data.role,
      status: data.status
    }
  });

  await replaceUserGroups(user.id, data.groupIds);
  await logAdminAction({
    actorUserId,
    action: "admin.user.update",
    targetType: "user",
    targetId: user.id,
    metadata: {
      email: user.email,
      role: user.role,
      status: user.status,
      groupIds: data.groupIds
    }
  });

  return user;
}

export async function createAdminGroup({
  actorUserId,
  input
}: {
  actorUserId: string;
  input: unknown;
}) {
  const data = groupCreateSchema.parse(input);
  const group = await prisma.group.create({
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description || null
    }
  });

  await logAdminAction({
    actorUserId,
    action: "admin.group.create",
    targetType: "group",
    targetId: group.id,
    metadata: {
      slug: group.slug
    }
  });

  return group;
}

export async function updateAdminGroup({
  actorUserId,
  input
}: {
  actorUserId: string;
  input: unknown;
}) {
  const data = groupUpdateSchema.parse(input);
  const group = await prisma.group.update({
    where: { id: data.groupId },
    data: {
      name: data.name,
      slug: data.slug,
      description: data.description || null
    }
  });

  await logAdminAction({
    actorUserId,
    action: "admin.group.update",
    targetType: "group",
    targetId: group.id,
    metadata: {
      slug: group.slug
    }
  });

  return group;
}

export async function deleteAdminGroup({
  actorUserId,
  groupId
}: {
  actorUserId: string;
  groupId: string;
}) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      _count: {
        select: {
          assignments: true,
          memberships: true
        }
      }
    }
  });

  if (!group) {
    throw new Error("Group not found.");
  }

  if (group._count.assignments > 0 || group._count.memberships > 0) {
    throw new Error("Only groups without assignments or members can be deleted.");
  }

  await prisma.group.delete({ where: { id: group.id } });
  await logAdminAction({
    actorUserId,
    action: "admin.group.delete",
    targetType: "group",
    targetId: group.id,
    metadata: {
      slug: group.slug
    }
  });
}

export async function createAdminModule({
  actorUserId,
  input
}: {
  actorUserId: string;
  input: unknown;
}) {
  const data = moduleCreateSchema.parse(input);
  const learningModule = await prisma.module.create({
    data: {
      title: data.title,
      slug: data.slug,
      summary: data.summary,
      bodyMarkdown: data.bodyMarkdown,
      difficulty: data.difficulty,
      estimatedMinutes: data.estimatedMinutes,
      status: data.status,
      tags: data.tags,
      createdById: actorUserId
    }
  });

  await logAdminAction({
    actorUserId,
    action: "admin.module.create",
    targetType: "module",
    targetId: learningModule.id,
    metadata: {
      slug: learningModule.slug,
      status: learningModule.status
    }
  });

  return learningModule;
}

export async function updateAdminModule({
  actorUserId,
  input
}: {
  actorUserId: string;
  input: unknown;
}) {
  const data = moduleUpdateSchema.parse(input);
  const learningModule = await prisma.module.update({
    where: { id: data.moduleId },
    data: {
      title: data.title,
      slug: data.slug,
      summary: data.summary,
      bodyMarkdown: data.bodyMarkdown,
      difficulty: data.difficulty,
      estimatedMinutes: data.estimatedMinutes,
      status: data.status,
      tags: data.tags
    }
  });

  await logAdminAction({
    actorUserId,
    action: "admin.module.update",
    targetType: "module",
    targetId: learningModule.id,
    metadata: {
      slug: learningModule.slug,
      status: learningModule.status
    }
  });

  return learningModule;
}

export async function createAdminChallenge({
  actorUserId,
  input
}: {
  actorUserId: string;
  input: unknown;
}) {
  const data = challengeCreateSchema.parse(input);
  const challenge = await prisma.challenge.create({
    data: {
      title: data.title,
      slug: data.slug,
      description: data.description,
      type: data.type,
      difficulty: data.difficulty,
      points: data.points,
      status: data.status,
      tags: data.tags,
      validationConfig: toPrismaJson(data.validationConfig),
      runtimeConfig: toPrismaJson(data.runtimeConfig),
      createdById: actorUserId
    }
  });

  await logAdminAction({
    actorUserId,
    action: "admin.challenge.create",
    targetType: "challenge",
    targetId: challenge.id,
    metadata: {
      slug: challenge.slug,
      type: challenge.type,
      status: challenge.status
    }
  });

  return challenge;
}

export async function updateAdminChallenge({
  actorUserId,
  input
}: {
  actorUserId: string;
  input: unknown;
}) {
  const data = challengeUpdateSchema.parse(input);
  const challenge = await prisma.challenge.update({
    where: { id: data.challengeId },
    data: {
      title: data.title,
      slug: data.slug,
      description: data.description,
      type: data.type,
      difficulty: data.difficulty,
      points: data.points,
      status: data.status,
      tags: data.tags,
      validationConfig: toPrismaJson(data.validationConfig),
      runtimeConfig: toPrismaJson(data.runtimeConfig)
    }
  });

  await logAdminAction({
    actorUserId,
    action: "admin.challenge.update",
    targetType: "challenge",
    targetId: challenge.id,
    metadata: {
      slug: challenge.slug,
      type: challenge.type,
      status: challenge.status
    }
  });

  return challenge;
}

export async function upsertAdminModuleChallenge({
  actorUserId,
  input
}: {
  actorUserId: string;
  input: unknown;
}) {
  const data = moduleChallengeSchema.parse(input);
  const moduleChallenge = await prisma.moduleChallenge.upsert({
    where: {
      moduleId_challengeId: {
        moduleId: data.moduleId,
        challengeId: data.challengeId
      }
    },
    update: {
      sortOrder: data.sortOrder,
      required: data.required
    },
    create: {
      moduleId: data.moduleId,
      challengeId: data.challengeId,
      sortOrder: data.sortOrder,
      required: data.required
    }
  });

  await logAdminAction({
    actorUserId,
    action: "admin.module_challenge.upsert",
    targetType: "module_challenge",
    targetId: moduleChallenge.id,
    metadata: {
      moduleId: moduleChallenge.moduleId,
      challengeId: moduleChallenge.challengeId,
      required: moduleChallenge.required,
      sortOrder: moduleChallenge.sortOrder
    }
  });

  return moduleChallenge;
}

function assignmentTargetInput({
  targetType,
  targetId
}: {
  targetType: "user" | "group";
  targetId: string;
}) {
  return normalizeAssignmentTarget({
    userId: targetType === "user" ? targetId : null,
    groupId: targetType === "group" ? targetId : null
  });
}

export async function createAdminAssignment({
  actorUserId,
  input
}: {
  actorUserId: string;
  input: unknown;
}) {
  const data = assignmentCreateSchema.parse(input);
  const target = assignmentTargetInput(data);
  const where: Prisma.AssignmentWhereInput = {
    moduleId: data.moduleId,
    ...assignmentTargetWhere(target)
  };
  const existingAssignment = await prisma.assignment.findFirst({ where });

  if (existingAssignment) {
    throw new Error("This module is already assigned to that target.");
  }

  const assignment = await prisma.assignment.create({
    data: {
      moduleId: data.moduleId,
      assignedById: actorUserId,
      dueAt: data.dueAt,
      required: data.required,
      ...target
    }
  });

  await logAdminAction({
    actorUserId,
    action: "admin.assignment.create",
    targetType: "assignment",
    targetId: assignment.id,
    metadata: {
      moduleId: assignment.moduleId,
      userId: assignment.userId,
      groupId: assignment.groupId,
      dueAt: assignment.dueAt?.toISOString() ?? null,
      required: assignment.required
    }
  });

  return assignment;
}

export async function updateAdminAssignment({
  actorUserId,
  input
}: {
  actorUserId: string;
  input: unknown;
}) {
  const data = assignmentUpdateSchema.parse(input);
  const target = assignmentTargetInput(data);
  const where: Prisma.AssignmentWhereInput = {
    moduleId: data.moduleId,
    ...assignmentTargetWhere(target),
    NOT: {
      id: data.assignmentId
    }
  };
  const conflictingAssignment = await prisma.assignment.findFirst({ where });

  if (conflictingAssignment) {
    throw new Error("This module is already assigned to that target.");
  }

  const previousAssignment = await prisma.assignment.findUnique({
    where: { id: data.assignmentId }
  });

  if (!previousAssignment) {
    throw new Error("Assignment not found.");
  }

  const assignment = await prisma.assignment.update({
    where: { id: data.assignmentId },
    data: {
      moduleId: data.moduleId,
      userId: "userId" in target ? target.userId : null,
      groupId: "groupId" in target ? target.groupId : null,
      dueAt: data.dueAt,
      required: data.required
    }
  });
  const targetChanged =
    previousAssignment.moduleId !== assignment.moduleId ||
    previousAssignment.userId !== assignment.userId ||
    previousAssignment.groupId !== assignment.groupId;
  const staleCompletionCount = targetChanged
    ? await reconcileCompletionsForRemovedAssignment({
        moduleId: previousAssignment.moduleId,
        targetUserIds: await userIdsForAssignmentTarget(previousAssignment)
      })
    : 0;

  await logAdminAction({
    actorUserId,
    action: "admin.assignment.update",
    targetType: "assignment",
    targetId: assignment.id,
    metadata: {
      moduleId: assignment.moduleId,
      userId: assignment.userId,
      groupId: assignment.groupId,
      dueAt: assignment.dueAt?.toISOString() ?? null,
      required: assignment.required,
      staleCompletionCount
    }
  });

  return assignment;
}

export async function deleteAdminAssignment({
  actorUserId,
  assignmentId
}: {
  actorUserId: string;
  assignmentId: string;
}) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId }
  });

  if (!assignment) {
    throw new Error("Assignment not found.");
  }

  await prisma.assignment.delete({
    where: { id: assignment.id }
  });
  const staleCompletionCount = await reconcileCompletionsForRemovedAssignment({
    moduleId: assignment.moduleId,
    targetUserIds: await userIdsForAssignmentTarget(assignment)
  });

  await logAdminAction({
    actorUserId,
    action: "admin.assignment.delete",
    targetType: "assignment",
    targetId: assignment.id,
    metadata: {
      moduleId: assignment.moduleId,
      userId: assignment.userId,
      groupId: assignment.groupId,
      staleCompletionCount
    }
  });
}
