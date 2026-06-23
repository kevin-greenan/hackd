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
    runningInstances
  ] = await Promise.all([
    prisma.user.count(),
    prisma.group.count(),
    prisma.module.count(),
    prisma.challenge.count(),
    prisma.assignment.count(),
    prisma.attempt.count(),
    prisma.completion.count(),
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
    runningInstances
  };
}
