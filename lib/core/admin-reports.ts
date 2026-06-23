import { AttemptResult, Prisma, Role } from "@prisma/client";
import { prisma } from "../db/prisma";
import { summarizeCompletionStatus } from "./completions";

const REPORT_LIMIT = 100;

type CsvValue = string | number | boolean | Date | null | undefined;

export type AdminReportFilters = {
  groupId?: string;
  learnerId?: string;
  moduleId?: string;
};

export function formatCsvRows(headers: string[], rows: CsvValue[][]) {
  const formatValue = (value: CsvValue) => {
    const text = value instanceof Date ? value.toISOString() : String(value ?? "");
    const escaped = text.replaceAll("\"", "\"\"");

    return `"${escaped}"`;
  };

  return [
    headers.map(formatValue).join(","),
    ...rows.map((row) => row.map(formatValue).join(","))
  ].join("\n");
}

export function normalizeAdminReportFilters(filters: AdminReportFilters = {}) {
  return {
    groupId: filters.groupId?.trim() || undefined,
    learnerId: filters.learnerId?.trim() || undefined,
    moduleId: filters.moduleId?.trim() || undefined
  };
}

function assignmentMatchesFilters(
  assignment: { groupId: string | null; moduleId: string; userId: string | null },
  user: { id: string; groupMemberships: { groupId: string }[] },
  filters: AdminReportFilters
) {
  if (filters.moduleId && assignment.moduleId !== filters.moduleId) {
    return false;
  }

  if (filters.learnerId && user.id !== filters.learnerId) {
    return false;
  }

  const userGroupIds = new Set(user.groupMemberships.map((membership) => membership.groupId));
  const assignmentTargetsUser = assignment.userId === user.id;
  const assignmentTargetsUserGroup = Boolean(assignment.groupId && userGroupIds.has(assignment.groupId));

  if (!assignmentTargetsUser && !assignmentTargetsUserGroup) {
    return false;
  }

  if (filters.groupId) {
    return assignmentTargetsUser || assignment.groupId === filters.groupId;
  }

  return true;
}

function completionWhere(filters: AdminReportFilters): Prisma.CompletionWhereInput {
  return {
    ...(filters.learnerId ? { userId: filters.learnerId } : {}),
    ...(filters.moduleId ? { moduleId: filters.moduleId } : {}),
    ...(filters.groupId
      ? {
          user: {
            groupMemberships: {
              some: {
                groupId: filters.groupId
              }
            }
          }
        }
      : {})
  };
}

function attemptWhere(filters: AdminReportFilters): Prisma.AttemptWhereInput {
  return {
    ...(filters.learnerId ? { userId: filters.learnerId } : {}),
    ...(filters.moduleId
      ? {
          challenge: {
            modules: {
              some: {
                moduleId: filters.moduleId
              }
            }
          }
        }
      : {}),
    ...(filters.groupId
      ? {
          user: {
            groupMemberships: {
              some: {
                groupId: filters.groupId
              }
            }
          }
        }
      : {})
  };
}

function assignmentWhere(filters: AdminReportFilters): Prisma.AssignmentWhereInput {
  const conditions: Prisma.AssignmentWhereInput[] = [];

  if (filters.moduleId) {
    conditions.push({ moduleId: filters.moduleId });
  }

  if (filters.groupId) {
    conditions.push({
      OR: [
        { groupId: filters.groupId },
        {
          user: {
            groupMemberships: {
              some: {
                groupId: filters.groupId
              }
            }
          }
        }
      ]
    });
  }

  if (filters.learnerId) {
    conditions.push({
      OR: [
        { userId: filters.learnerId },
        {
          group: {
            memberships: {
              some: {
                userId: filters.learnerId
              }
            }
          }
        }
      ]
    });
  }

  return conditions.length > 0 ? { AND: conditions } : {};
}

export async function getAdminProgressReports(filters: AdminReportFilters = {}) {
  const cleanedFilters = normalizeAdminReportFilters(filters);
  const [users, assignments, modules, challenges, recentAttempts] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: Role.LEARNER,
        ...(cleanedFilters.learnerId ? { id: cleanedFilters.learnerId } : {}),
        ...(cleanedFilters.groupId
          ? {
              groupMemberships: {
                some: {
                  groupId: cleanedFilters.groupId
                }
              }
            }
          : {})
      },
      take: REPORT_LIMIT,
      orderBy: { email: "asc" },
      include: {
        groupMemberships: {
          select: {
            groupId: true
          }
        },
        completions: true
      }
    }),
    prisma.assignment.findMany({
      where: assignmentWhere(cleanedFilters),
      select: {
        id: true,
        moduleId: true,
        userId: true,
        groupId: true
      }
    }),
    prisma.module.findMany({
      where: {
        ...(cleanedFilters.moduleId ? { id: cleanedFilters.moduleId } : {})
      },
      take: REPORT_LIMIT,
      orderBy: [{ status: "asc" }, { title: "asc" }],
      include: {
        completions: true,
        _count: {
          select: {
            assignments: true,
            challenges: true
          }
        }
      }
    }),
    prisma.challenge.findMany({
      where: {
        ...(cleanedFilters.moduleId
          ? {
              modules: {
                some: {
                  moduleId: cleanedFilters.moduleId
                }
              }
            }
          : {})
      },
      take: REPORT_LIMIT,
      orderBy: [{ type: "asc" }, { title: "asc" }],
      include: {
        attempts: {
          where: attemptWhere(cleanedFilters),
          select: {
            result: true,
            scoreAwarded: true
          }
        }
      }
    }),
    prisma.attempt.findMany({
      where: attemptWhere(cleanedFilters),
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        challenge: {
          select: {
            title: true,
            slug: true,
            type: true,
            points: true
          }
        }
      }
    })
  ]);

  const learnerProgress = users.map((user) => {
    const assignedModuleIds = new Set(
      assignments
        .filter((assignment) => assignmentMatchesFilters(assignment, user, cleanedFilters))
        .map((assignment) => assignment.moduleId)
    );
    const relevantCompletions = user.completions.filter((completion) =>
      assignedModuleIds.has(completion.moduleId)
    );
    const summary = summarizeCompletionStatus(relevantCompletions, assignedModuleIds.size);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      assignedModules: assignedModuleIds.size,
      ...summary
    };
  });

  const moduleProgress = modules.map((module) => {
    const filteredAssignments = assignments.filter((assignment) => assignment.moduleId === module.id);
    const filteredCompletions = module.completions.filter((completion) => {
      return (
        (!cleanedFilters.learnerId || completion.userId === cleanedFilters.learnerId) &&
        (!cleanedFilters.groupId ||
          users.some((user) => {
            return (
              user.id === completion.userId &&
              user.groupMemberships.some((membership) => membership.groupId === cleanedFilters.groupId)
            );
          }))
      );
    });
    const summary = summarizeCompletionStatus(filteredCompletions, filteredAssignments.length);

    return {
      id: module.id,
      title: module.title,
      slug: module.slug,
      status: module.status,
      assignedTargets: filteredAssignments.length,
      challenges: module._count.challenges,
      ...summary
    };
  });

  const challengePerformance = challenges.map((challenge) => {
    const correct = challenge.attempts.filter((attempt) => attempt.result === AttemptResult.CORRECT).length;
    const incorrect = challenge.attempts.filter((attempt) => attempt.result === AttemptResult.INCORRECT).length;
    const pending = challenge.attempts.filter(
      (attempt) => attempt.result === AttemptResult.PENDING_REVIEW
    ).length;
    const total = challenge.attempts.length;
    const averageScore =
      total === 0
        ? 0
        : Math.round(
            (challenge.attempts.reduce((sum, attempt) => sum + attempt.scoreAwarded, 0) / total) * 100
          ) / 100;

    return {
      id: challenge.id,
      title: challenge.title,
      slug: challenge.slug,
      type: challenge.type,
      points: challenge.points,
      total,
      correct,
      incorrect,
      pending,
      averageScore
    };
  });

  const totals = {
    learners: learnerProgress.length,
    assignedModules: learnerProgress.reduce((sum, learner) => sum + learner.assignedModules, 0),
    completedModules: learnerProgress.reduce((sum, learner) => sum + learner.completed, 0),
    attempts: challengePerformance.reduce((sum, challenge) => sum + challenge.total, 0)
  };

  return {
    totals: {
      ...totals,
      completionPercent:
        totals.assignedModules === 0
          ? 0
          : Math.round((totals.completedModules / totals.assignedModules) * 100)
    },
    learnerProgress,
    moduleProgress,
    challengePerformance,
    recentAttempts: recentAttempts.map((attempt) => ({
      id: attempt.id,
      learnerName: attempt.user.name,
      learnerEmail: attempt.user.email,
      challengeTitle: attempt.challenge.title,
      challengeSlug: attempt.challenge.slug,
      challengeType: attempt.challenge.type,
      result: attempt.result,
      scoreAwarded: attempt.scoreAwarded,
      points: attempt.challenge.points,
      createdAt: attempt.createdAt
    }))
  };
}

export async function getCompletionCsv(filters: AdminReportFilters = {}) {
  const cleanedFilters = normalizeAdminReportFilters(filters);
  const completions = await prisma.completion.findMany({
    where: completionWhere(cleanedFilters),
    take: 1000,
    orderBy: [{ updatedAt: "desc" }],
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      },
      module: {
        select: {
          title: true,
          slug: true
        }
      }
    }
  });

  return formatCsvRows(
    ["learner_name", "learner_email", "module_title", "module_slug", "status", "completed_at", "updated_at"],
    completions.map((completion) => [
      completion.user.name,
      completion.user.email,
      completion.module.title,
      completion.module.slug,
      completion.status,
      completion.completedAt,
      completion.updatedAt
    ])
  );
}

export async function getAttemptCsv(filters: AdminReportFilters = {}) {
  const cleanedFilters = normalizeAdminReportFilters(filters);
  const attempts = await prisma.attempt.findMany({
    where: attemptWhere(cleanedFilters),
    take: 1000,
    orderBy: [{ createdAt: "desc" }],
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      },
      challenge: {
        select: {
          title: true,
          slug: true,
          type: true,
          points: true
        }
      }
    }
  });

  return formatCsvRows(
    [
      "created_at",
      "learner_name",
      "learner_email",
      "challenge_title",
      "challenge_slug",
      "challenge_type",
      "result",
      "score_awarded",
      "points"
    ],
    attempts.map((attempt) => [
      attempt.createdAt,
      attempt.user.name,
      attempt.user.email,
      attempt.challenge.title,
      attempt.challenge.slug,
      attempt.challenge.type,
      attempt.result,
      attempt.scoreAwarded,
      attempt.challenge.points
    ])
  );
}
