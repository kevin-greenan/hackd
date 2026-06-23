import { prisma } from "../db/prisma";

export async function getAdminMetrics() {
  const [
    users,
    groups,
    modules,
    challenges,
    assignments,
    attempts,
    completions,
    auditLogs,
    runningInstances
  ] = await Promise.all([
    prisma.user.count(),
    prisma.group.count(),
    prisma.module.count(),
    prisma.challenge.count(),
    prisma.assignment.count(),
    prisma.attempt.count(),
    prisma.completion.count(),
    prisma.auditLog.count(),
    prisma.challengeInstance.count({ where: { status: { in: ["STARTING", "RUNNING"] } } })
  ]);

  return {
    users,
    groups,
    modules,
    challenges,
    assignments,
    attempts,
    completions,
    auditLogs,
    runningInstances
  };
}

export async function getRecentAdminAttempts(limit = 10) {
  const attempts = await prisma.attempt.findMany({
    take: limit,
    orderBy: {
      createdAt: "desc"
    },
    include: {
      user: {
        select: {
          email: true,
          name: true
        }
      },
      challenge: {
        select: {
          title: true,
          type: true,
          points: true
        }
      }
    }
  });

  return attempts.map((attempt) => ({
    id: attempt.id,
    learnerName: attempt.user.name,
    learnerEmail: attempt.user.email,
    challengeTitle: attempt.challenge.title,
    challengeType: attempt.challenge.type,
    result: attempt.result,
    scoreAwarded: attempt.scoreAwarded,
    points: attempt.challenge.points,
    createdAt: attempt.createdAt
  }));
}
