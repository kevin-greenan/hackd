import type { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";

type AssignmentTarget =
  | { userId: string; groupId?: never }
  | { userId?: never; groupId: string };

export function normalizeAssignmentTarget(target: {
  userId?: string | null;
  groupId?: string | null;
}): AssignmentTarget {
  const userId = target.userId?.trim() || undefined;
  const groupId = target.groupId?.trim() || undefined;

  if ((userId && groupId) || (!userId && !groupId)) {
    throw new Error("Assignment must target exactly one user or group.");
  }

  return userId ? { userId } : { groupId: groupId as string };
}

export function assignmentTargetWhere(target: AssignmentTarget) {
  return "userId" in target ? { userId: target.userId } : { groupId: target.groupId };
}

export async function createAssignment(input: {
  moduleId: string;
  assignedById?: string | null;
  dueAt?: Date | null;
  required?: boolean;
  target: {
    userId?: string | null;
    groupId?: string | null;
  };
}) {
  const target = normalizeAssignmentTarget(input.target);

  return prisma.assignment.create({
    data: {
      moduleId: input.moduleId,
      assignedById: input.assignedById,
      dueAt: input.dueAt,
      required: input.required ?? true,
      ...target
    }
  });
}

export async function upsertSeedAssignment(input: {
  moduleId: string;
  assignedById?: string | null;
  dueAt?: Date | null;
  required?: boolean;
  target: {
    userId?: string | null;
    groupId?: string | null;
  };
}) {
  const target = normalizeAssignmentTarget(input.target);
  const where: Prisma.AssignmentWhereInput = {
    moduleId: input.moduleId,
    ...assignmentTargetWhere(target)
  };

  const existing = await prisma.assignment.findFirst({ where });

  if (existing) {
    return prisma.assignment.update({
      where: { id: existing.id },
      data: {
        assignedById: input.assignedById,
        dueAt: input.dueAt,
        required: input.required ?? true
      }
    });
  }

  return createAssignment(input);
}
