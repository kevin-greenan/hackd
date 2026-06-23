import type { AssignmentStatus } from "@prisma/client";
import { prisma } from "../db/prisma";
import { summarizeCompletionStatus } from "./completions";

export type LearnerAssignment = {
  id: string;
  required: boolean;
  dueAt: Date | null;
  targetType: "user" | "group";
  completionStatus: AssignmentStatus | "NOT_STARTED";
  module: {
    title: string;
    slug: string;
    summary: string;
    difficulty: string;
    estimatedMinutes: number | null;
    tags: string[];
    challengeCount: number;
  };
};

export async function getLearnerDashboard(userId: string) {
  const memberships = await prisma.groupMembership.findMany({
    where: { userId },
    select: { groupId: true }
  });
  const groupIds = memberships.map((membership) => membership.groupId);

  const assignments = await prisma.assignment.findMany({
    where: {
      OR: [{ userId }, ...(groupIds.length > 0 ? [{ groupId: { in: groupIds } }] : [])]
    },
    include: {
      module: {
        include: {
          challenges: true
        }
      }
    },
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }]
  });
  const assignedModuleIds = [...new Set(assignments.map((assignment) => assignment.moduleId))];

  const [completions, attempts] = await Promise.all([
    assignedModuleIds.length > 0
      ? prisma.completion.findMany({
          where: {
            userId,
            moduleId: { in: assignedModuleIds }
          }
        })
      : Promise.resolve([]),
    prisma.attempt.findMany({
      where: { userId },
      include: { challenge: true },
      orderBy: { createdAt: "desc" },
      take: 5
    })
  ]);

  const completionByModule = new Map(
    completions.map((completion) => [completion.moduleId, completion.status])
  );

  const assignedModules: LearnerAssignment[] = assignments.map((assignment) => ({
    id: assignment.id,
    required: assignment.required,
    dueAt: assignment.dueAt,
    targetType: assignment.userId ? "user" : "group",
    completionStatus: completionByModule.get(assignment.moduleId) ?? "NOT_STARTED",
    module: {
      title: assignment.module.title,
      slug: assignment.module.slug,
      summary: assignment.module.summary,
      difficulty: assignment.module.difficulty,
      estimatedMinutes: assignment.module.estimatedMinutes,
      tags: assignment.module.tags,
      challengeCount: assignment.module.challenges.length
    }
  }));

  return {
    assignedModules,
    recentAttempts: attempts.map((attempt) => ({
      id: attempt.id,
      result: attempt.result,
      challengeTitle: attempt.challenge.title,
      createdAt: attempt.createdAt
    })),
    summary: summarizeCompletionStatus(completions, assignments.length)
  };
}
