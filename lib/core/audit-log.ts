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

export async function getAdminAuditLogs(limit = 100) {
  const auditLogs = await prisma.auditLog.findMany({
    take: limit,
    orderBy: {
      createdAt: "desc"
    },
    include: {
      actor: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });

  return auditLogs.map((log) => ({
    id: log.id,
    action: log.action,
    targetType: log.targetType,
    targetId: log.targetId,
    metadata: log.metadata,
    actorName: log.actor?.name ?? "Unknown actor",
    actorEmail: log.actor?.email ?? null,
    createdAt: log.createdAt
  }));
}
