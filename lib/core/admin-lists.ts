import { prisma } from "../db/prisma";

const DEFAULT_LIMIT = 100;

export function formatAdminLabel(value: string) {
  return value.toLowerCase().replaceAll("_", " ");
}

export async function getAdminUsers(limit = DEFAULT_LIMIT) {
  const users = await prisma.user.findMany({
    take: limit,
    orderBy: [{ role: "asc" }, { email: "asc" }],
    include: {
      groupMemberships: {
        include: {
          group: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          group: {
            name: "asc"
          }
        }
      },
      _count: {
        select: {
          assignments: true,
          attempts: true,
          completions: true
        }
      }
    }
  });

  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    groups: user.groupMemberships.map((membership) => ({
      id: membership.group.id,
      name: membership.group.name
    })),
    assignments: user._count.assignments,
    attempts: user._count.attempts,
    completions: user._count.completions,
    createdAt: user.createdAt
  }));
}

export async function getAdminGroups(limit = DEFAULT_LIMIT) {
  const groups = await prisma.group.findMany({
    take: limit,
    orderBy: {
      name: "asc"
    },
    include: {
      _count: {
        select: {
          memberships: true,
          assignments: true
        }
      }
    }
  });

  return groups.map((group) => ({
    id: group.id,
    name: group.name,
    slug: group.slug,
    description: group.description,
    members: group._count.memberships,
    assignments: group._count.assignments,
    createdAt: group.createdAt
  }));
}

export async function getAdminModules(limit = DEFAULT_LIMIT) {
  const modules = await prisma.module.findMany({
    take: limit,
    orderBy: [{ status: "asc" }, { title: "asc" }],
    include: {
      createdBy: {
        select: {
          name: true,
          email: true
        }
      },
      _count: {
        select: {
          challenges: true,
          assignments: true,
          completions: true
        }
      }
    }
  });

  return modules.map((module) => ({
    id: module.id,
    title: module.title,
    slug: module.slug,
    summary: module.summary,
    bodyMarkdown: module.bodyMarkdown,
    status: module.status,
    difficulty: module.difficulty,
    estimatedMinutes: module.estimatedMinutes,
    tags: module.tags,
    createdBy: module.createdBy,
    challenges: module._count.challenges,
    assignments: module._count.assignments,
    completions: module._count.completions,
    updatedAt: module.updatedAt
  }));
}

export async function getAdminChallenges(limit = DEFAULT_LIMIT) {
  const challenges = await prisma.challenge.findMany({
    take: limit,
    orderBy: [{ status: "asc" }, { type: "asc" }, { title: "asc" }],
    include: {
      createdBy: {
        select: {
          name: true,
          email: true
        }
      },
      _count: {
        select: {
          modules: true,
          attempts: true,
          challengeInstances: true
        }
      }
    }
  });

  return challenges.map((challenge) => ({
    id: challenge.id,
    title: challenge.title,
    slug: challenge.slug,
    description: challenge.description,
    type: challenge.type,
    status: challenge.status,
    difficulty: challenge.difficulty,
    points: challenge.points,
    tags: challenge.tags,
    validationConfig: challenge.validationConfig,
    runtimeConfig: challenge.runtimeConfig,
    createdBy: challenge.createdBy,
    modules: challenge._count.modules,
    attempts: challenge._count.attempts,
    runningInstances: challenge._count.challengeInstances,
    updatedAt: challenge.updatedAt
  }));
}

export async function getAdminModuleOptions(limit = DEFAULT_LIMIT) {
  return prisma.module.findMany({
    take: limit,
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      slug: true
    }
  });
}

export async function getAdminChallengeOptions(limit = DEFAULT_LIMIT) {
  return prisma.challenge.findMany({
    take: limit,
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      type: true
    }
  });
}

export async function getAdminAssignments(limit = DEFAULT_LIMIT) {
  const assignments = await prisma.assignment.findMany({
    take: limit,
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    include: {
      module: {
        select: {
          title: true,
          slug: true,
          status: true
        }
      },
      user: {
        select: {
          name: true,
          email: true
        }
      },
      group: {
        select: {
          name: true,
          slug: true
        }
      },
      assignedBy: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });

  return assignments.map((assignment) => ({
    id: assignment.id,
    module: assignment.module,
    target: assignment.user
      ? {
          type: "user" as const,
          name: assignment.user.name,
          detail: assignment.user.email
        }
      : {
          type: "group" as const,
          name: assignment.group?.name ?? "Unknown group",
          detail: assignment.group?.slug ?? "missing-group"
        },
    assignedBy: assignment.assignedBy,
    required: assignment.required,
    dueAt: assignment.dueAt,
    createdAt: assignment.createdAt
  }));
}
