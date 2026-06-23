import { ChallengeType } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { validateChallengeSubmission } from "@/lib/core/challenge-validation";

describe("challenge validation", () => {
  it("validates static flag submissions", () => {
    expect(
      validateChallengeSubmission({
        challengeType: ChallengeType.STATIC_FLAG,
        validationConfig: { type: "static_flag", flag: "flag{sample}" },
        submittedValue: " flag{sample} "
      })
    ).toEqual({
      isCorrect: true,
      feedback: "Correct.",
      scoreAwarded: 1
    });
  });

  it("rejects incorrect static flags without leaking the expected answer", () => {
    const result = validateChallengeSubmission({
      challengeType: ChallengeType.STATIC_FLAG,
      validationConfig: { type: "static_flag", flag: "flag{sample}" },
      submittedValue: "flag{wrong}"
    });

    expect(result.isCorrect).toBe(false);
    expect(result.feedback).not.toContain("flag{sample}");
  });

  it("validates case-insensitive exact text answers", () => {
    expect(
      validateChallengeSubmission({
        challengeType: ChallengeType.SHORT_ANSWER,
        validationConfig: {
          type: "exact_text",
          acceptedAnswers: ["idor", "insecure direct object reference"],
          caseInsensitive: true
        },
        submittedValue: "IDOR"
      }).isCorrect
    ).toBe(true);
  });

  it("returns a disabled response for unsupported challenge types", () => {
    expect(
      validateChallengeSubmission({
        challengeType: ChallengeType.DOCKER_WEB,
        validationConfig: { type: "docker" },
        submittedValue: "anything"
      })
    ).toEqual({
      isCorrect: false,
      feedback: "Submissions are not enabled for this challenge type yet.",
      scoreAwarded: 0
    });
  });
});
