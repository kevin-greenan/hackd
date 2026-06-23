import { AssignmentStatus, AttemptResult, ContentStatus, Role } from "@prisma/client";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { prisma } from "../db/prisma";
import { getLearnerModuleDetail } from "./module-detail";
import { validateChallengeSubmission } from "./challenge-validation";

export type ChallengeSubmissionResult = {
  result: AttemptResult;
  feedback: string;
  moduleCompleted: boolean;
};

async function updateModuleCompletion({
  userId,
  moduleId
}: {
  userId: string;
  moduleId: string;
}) {
  const requiredChallenges = await prisma.moduleChallenge.findMany({
    where: {
      moduleId,
      required: true
    },
    include: {
      challenge: {
        include: {
          attempts: {
            where: {
              userId,
              result: AttemptResult.CORRECT
            },
            take: 1
          }
        }
      }
    }
  });

  const allRequiredComplete =
    requiredChallenges.length > 0 &&
    requiredChallenges.every((moduleChallenge) => moduleChallenge.challenge.attempts.length > 0);
  const status = allRequiredComplete ? AssignmentStatus.COMPLETED : AssignmentStatus.IN_PROGRESS;

  await prisma.completion.upsert({
    where: {
      userId_moduleId: {
        userId,
        moduleId
      }
    },
    update: {
      status,
      completedAt: allRequiredComplete ? new Date() : null
    },
    create: {
      userId,
      moduleId,
      status,
      completedAt: allRequiredComplete ? new Date() : null
    }
  });

  return allRequiredComplete;
}

function positiveIntegerEnv(name: string, fallback: number) {
  const parsed = Number(process.env[name]);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function submitChallengeAnswer({
  userId,
  role,
  moduleSlug,
  challengeId,
  submittedValue
}: {
  userId: string;
  role: Role;
  moduleSlug: string;
  challengeId: string;
  submittedValue: string;
}): Promise<ChallengeSubmissionResult> {
  const learningModule = await getLearnerModuleDetail({ userId, role, slug: moduleSlug });

  if (!learningModule) {
    throw new Error("Module not found or not assigned.");
  }

  if (learningModule.assignment.targetType === "preview") {
    throw new Error("Preview modules cannot record learner attempts.");
  }

  const moduleChallenge = await prisma.moduleChallenge.findFirst({
    where: {
      moduleId: learningModule.id,
      challengeId,
      challenge: {
        status: ContentStatus.PUBLISHED
      }
    },
    include: {
      challenge: true
    }
  });

  if (!moduleChallenge) {
    throw new Error("Challenge not found for this module.");
  }

  const limit = positiveIntegerEnv("CHALLENGE_SUBMISSION_LIMIT", 10);
  const windowMs = positiveIntegerEnv("CHALLENGE_SUBMISSION_WINDOW_SECONDS", 60) * 1000;
  const rateLimit = checkRateLimit(`challenge-submission:${userId}:${challengeId}`, limit, windowMs);

  if (!rateLimit.allowed) {
    throw new Error("Too many submissions. Wait a minute and try again.");
  }

  const validation = validateChallengeSubmission({
    challengeType: moduleChallenge.challenge.type,
    validationConfig: moduleChallenge.challenge.validationConfig,
    submittedValue
  });
  const result = validation.isCorrect ? AttemptResult.CORRECT : AttemptResult.INCORRECT;

  await prisma.attempt.create({
    data: {
      userId,
      challengeId,
      submittedValue,
      result,
      scoreAwarded: validation.isCorrect ? moduleChallenge.challenge.points : 0,
      feedback: validation.feedback
    }
  });

  const moduleCompleted = await updateModuleCompletion({
    userId,
    moduleId: learningModule.id
  });

  return {
    result,
    feedback: validation.feedback,
    moduleCompleted
  };
}
