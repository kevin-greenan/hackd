import { Role, UserStatus } from "@prisma/client";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "../db/prisma";
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
