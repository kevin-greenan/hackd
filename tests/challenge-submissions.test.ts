import { AssignmentStatus, AttemptResult, ChallengeType, ContentStatus, Role } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getLearnerModuleDetail: vi.fn(),
  moduleChallengeFindFirst: vi.fn(),
  moduleChallengeFindMany: vi.fn(),
  attemptCreate: vi.fn(),
  completionUpsert: vi.fn()
}));

vi.mock("@/lib/core/module-detail", () => ({
  getLearnerModuleDetail: mocks.getLearnerModuleDetail
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    moduleChallenge: {
      findFirst: mocks.moduleChallengeFindFirst,
      findMany: mocks.moduleChallengeFindMany
    },
    attempt: {
      create: mocks.attemptCreate
    },
    completion: {
      upsert: mocks.completionUpsert
    }
  }
}));

const { submitChallengeAnswer } = await import("@/lib/core/challenge-submissions");
const { resetRateLimits } = await import("@/lib/auth/rate-limit");

describe("challenge submissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    resetRateLimits();
  });

  it("records a correct attempt and marks the module complete when all required challenges are correct", async () => {
    mocks.getLearnerModuleDetail.mockResolvedValue({
      id: "module-1",
      title: "Web Basics",
      slug: "web-basics",
      summary: "Learn the basics.",
      bodyMarkdown: "",
      difficulty: "beginner",
      estimatedMinutes: 30,
      tags: [],
      assignment: {
        id: "assignment-1",
        required: true,
        dueAt: null,
        targetType: "user"
      },
      completionStatus: AssignmentStatus.IN_PROGRESS,
      challenges: []
    });
    mocks.moduleChallengeFindFirst.mockResolvedValue({
      moduleId: "module-1",
      challengeId: "challenge-1",
      required: true,
      challenge: {
        id: "challenge-1",
        type: ChallengeType.STATIC_FLAG,
        points: 25,
        validationConfig: { type: "static_flag", flag: "flag{sample}" },
        status: ContentStatus.PUBLISHED
      }
    });
    mocks.moduleChallengeFindMany.mockResolvedValue([
      {
        challenge: {
          attempts: [{ id: "attempt-1", result: AttemptResult.CORRECT }]
        }
      }
    ]);

    const result = await submitChallengeAnswer({
      userId: "user-1",
      role: Role.LEARNER,
      moduleSlug: "web-basics",
      challengeId: "challenge-1",
      submittedValue: " flag{sample} "
    });

    expect(result).toEqual({
      result: AttemptResult.CORRECT,
      feedback: "Correct.",
      moduleCompleted: true
    });
    expect(mocks.attemptCreate).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        challengeId: "challenge-1",
        submittedValue: " flag{sample} ",
        result: AttemptResult.CORRECT,
        scoreAwarded: 25,
        feedback: "Correct."
      }
    });
    expect(mocks.completionUpsert).toHaveBeenCalledWith({
      where: {
        userId_moduleId: {
          userId: "user-1",
          moduleId: "module-1"
        }
      },
      update: {
        status: AssignmentStatus.COMPLETED,
        completedAt: expect.any(Date)
      },
      create: {
        userId: "user-1",
        moduleId: "module-1",
        status: AssignmentStatus.COMPLETED,
        completedAt: expect.any(Date)
      }
    });
  });

  it("throttles repeated submissions for the same user and challenge", async () => {
    vi.stubEnv("CHALLENGE_SUBMISSION_LIMIT", "1");
    vi.stubEnv("CHALLENGE_SUBMISSION_WINDOW_SECONDS", "60");
    mocks.getLearnerModuleDetail.mockResolvedValue({
      id: "module-1",
      title: "Web Basics",
      slug: "web-basics",
      summary: "Learn the basics.",
      bodyMarkdown: "",
      difficulty: "beginner",
      estimatedMinutes: 30,
      tags: [],
      assignment: {
        id: "assignment-1",
        required: true,
        dueAt: null,
        targetType: "user"
      },
      completionStatus: AssignmentStatus.IN_PROGRESS,
      challenges: []
    });
    mocks.moduleChallengeFindFirst.mockResolvedValue({
      moduleId: "module-1",
      challengeId: "challenge-1",
      required: true,
      challenge: {
        id: "challenge-1",
        type: ChallengeType.STATIC_FLAG,
        points: 25,
        validationConfig: { type: "static_flag", flag: "flag{sample}" },
        status: ContentStatus.PUBLISHED
      }
    });
    mocks.moduleChallengeFindMany.mockResolvedValue([
      {
        challenge: {
          attempts: []
        }
      }
    ]);

    await submitChallengeAnswer({
      userId: "user-1",
      role: Role.LEARNER,
      moduleSlug: "web-basics",
      challengeId: "challenge-1",
      submittedValue: "wrong"
    });

    await expect(
      submitChallengeAnswer({
        userId: "user-1",
        role: Role.LEARNER,
        moduleSlug: "web-basics",
        challengeId: "challenge-1",
        submittedValue: "wrong again"
      })
    ).rejects.toThrow("Too many submissions");
    expect(mocks.attemptCreate).toHaveBeenCalledTimes(1);
  });
});
