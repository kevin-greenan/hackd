import {
  AttemptResult,
  ContentStatus,
  Role,
  type AssignmentStatus,
  type ChallengeType,
  type InstanceStatus
} from "@prisma/client";
import { prisma } from "../db/prisma";
import {
  getChallengeSubmissionConfig,
  type ChallengeSubmissionConfig
} from "./challenge-validation";

export type LearnerModuleChallenge = {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: ChallengeType;
  difficulty: string;
  points: number;
  required: boolean;
  sortOrder: number;
  tags: string[];
  attemptCount: number;
  isComplete: boolean;
  supportsSubmission: boolean;
  submissionConfig: ChallengeSubmissionConfig | null;
  latestAttempt: {
    result: AttemptResult;
    feedback: string | null;
    createdAt: Date;
  } | null;
  recentAttempts: {
    result: AttemptResult;
    feedback: string | null;
    scoreAwarded: number;
    createdAt: Date;
  }[];
  attachments: {
    id: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
  }[];
  activeInstance: {
    id: string;
    status: InstanceStatus;
    url: string | null;
    expiresAt: Date | null;
    statusMessage: string | null;
  } | null;
};

export type LearnerModuleDetail = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  bodyMarkdown: string;
  difficulty: string;
  estimatedMinutes: number | null;
  tags: string[];
  assignment: {
    id: string;
    required: boolean;
    dueAt: Date | null;
    targetType: "user" | "group" | "preview";
  };
  completionStatus: AssignmentStatus | "NOT_STARTED";
  challenges: LearnerModuleChallenge[];
};

export function getChallengeCompletionState(attempts: { result: AttemptResult }[]) {
  return attempts.some((attempt) => attempt.result === AttemptResult.CORRECT);
}

export async function getLearnerModuleDetail({
  userId,
  role,
  slug
}: {
  userId: string;
  role: Role;
  slug: string;
}): Promise<LearnerModuleDetail | null> {
  const memberships = await prisma.groupMembership.findMany({
    where: { userId },
    select: { groupId: true }
  });
  const groupIds = memberships.map((membership) => membership.groupId);

  const learningModule = await prisma.module.findUnique({
    where: { slug },
    include: {
      challenges: {
        include: {
          challenge: {
            include: {
              attachments: {
                orderBy: { createdAt: "desc" },
                select: {
                  id: true,
                  originalName: true,
                  mimeType: true,
                  sizeBytes: true
                }
              },
              attempts: {
                where: { userId },
                orderBy: { createdAt: "desc" }
              },
              challengeInstances: {
                where: { userId },
                orderBy: { createdAt: "desc" },
                take: 1
              }
            }
          }
        },
        orderBy: { sortOrder: "asc" }
      },
      assignments: {
        where:
          role === Role.ADMIN
            ? {}
            : {
                OR: [{ userId }, ...(groupIds.length > 0 ? [{ groupId: { in: groupIds } }] : [])]
              },
        orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }]
      },
      completions: {
        where: { userId },
        take: 1
      }
    }
  });

  if (!learningModule) {
    return null;
  }

  if (learningModule.status !== ContentStatus.PUBLISHED && role !== Role.ADMIN) {
    return null;
  }

  const assignment = learningModule.assignments[0];

  if (!assignment && role !== Role.ADMIN) {
    return null;
  }

  return {
    id: learningModule.id,
    title: learningModule.title,
    slug: learningModule.slug,
    summary: learningModule.summary,
    bodyMarkdown: learningModule.bodyMarkdown,
    difficulty: learningModule.difficulty,
    estimatedMinutes: learningModule.estimatedMinutes,
    tags: learningModule.tags,
    assignment: assignment
      ? {
          id: assignment.id,
          required: assignment.required,
          dueAt: assignment.dueAt,
          targetType: assignment.userId ? "user" : "group"
        }
      : {
          id: "preview",
          required: false,
          dueAt: null,
          targetType: "preview"
        },
    completionStatus: learningModule.completions[0]?.status ?? "NOT_STARTED",
    challenges: learningModule.challenges.map((moduleChallenge) => {
      const submissionConfig = getChallengeSubmissionConfig({
        challengeType: moduleChallenge.challenge.type,
        validationConfig: moduleChallenge.challenge.validationConfig
      });
      const activeInstance = moduleChallenge.challenge.challengeInstances[0];

      return {
        id: moduleChallenge.challenge.id,
        title: moduleChallenge.challenge.title,
        slug: moduleChallenge.challenge.slug,
        description: moduleChallenge.challenge.description,
        type: moduleChallenge.challenge.type,
        difficulty: moduleChallenge.challenge.difficulty,
        points: moduleChallenge.challenge.points,
        required: moduleChallenge.required,
        sortOrder: moduleChallenge.sortOrder,
        tags: moduleChallenge.challenge.tags,
        attemptCount: moduleChallenge.challenge.attempts.length,
        isComplete: getChallengeCompletionState(moduleChallenge.challenge.attempts),
        supportsSubmission: submissionConfig !== null,
        submissionConfig,
        latestAttempt: moduleChallenge.challenge.attempts[0]
          ? {
              result: moduleChallenge.challenge.attempts[0].result,
              feedback: moduleChallenge.challenge.attempts[0].feedback,
              createdAt: moduleChallenge.challenge.attempts[0].createdAt
            }
          : null,
        recentAttempts: moduleChallenge.challenge.attempts.slice(0, 5).map((attempt) => ({
          result: attempt.result,
          feedback: attempt.feedback,
          scoreAwarded: attempt.scoreAwarded,
          createdAt: attempt.createdAt
        })),
        attachments: moduleChallenge.challenge.attachments,
        activeInstance: activeInstance
          ? {
              id: activeInstance.id,
              status: activeInstance.status,
              url: activeInstance.url,
              expiresAt: activeInstance.expiresAt,
              statusMessage: activeInstance.statusMessage
            }
          : null
      };
    })
  };
}
