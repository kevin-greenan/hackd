import type { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";

export async function logAdminAction({
  actorUserId,
  action,
  targetType,
  targetId,
  metadata
}: {
  actorUserId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.auditLog.create({
    data: {
      actorUserId,
      action,
      targetType,
      targetId,
      metadata
    }
  });
}
