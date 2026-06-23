import { ChallengeType } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  getChallengeSubmissionConfig,
  validateChallengeSubmission
} from "@/lib/core/challenge-validation";

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

  it("validates a single-answer multiple-choice submission", () => {
    expect(
      validateChallengeSubmission({
        challengeType: ChallengeType.MULTIPLE_CHOICE,
        validationConfig: {
          type: "multiple_choice",
          allowMultiple: false,
          options: [
            { id: "escaping", label: "Output escaping" },
            { id: "plaintext", label: "Plaintext password storage" }
          ],
          correctOptionIds: ["escaping"]
        },
        submittedValue: "escaping"
      }).isCorrect
    ).toBe(true);
  });

  it("validates a multi-answer multiple-choice submission regardless of selection order", () => {
    expect(
      validateChallengeSubmission({
        challengeType: ChallengeType.MULTIPLE_CHOICE,
        validationConfig: {
          type: "multiple_choice",
          allowMultiple: true,
          options: [
            { id: "query", label: "Query string parameters" },
            { id: "headers", label: "HTTP request headers" },
            { id: "config", label: "Server-side configuration" }
          ],
          correctOptionIds: ["query", "headers"]
        },
        submittedValue: JSON.stringify(["headers", "query"])
      }).isCorrect
    ).toBe(true);
  });

  it("rejects multiple-choice submissions with unknown option ids", () => {
    expect(
      validateChallengeSubmission({
        challengeType: ChallengeType.MULTIPLE_CHOICE,
        validationConfig: {
          type: "multiple_choice",
          allowMultiple: true,
          options: [
            { id: "query", label: "Query string parameters" },
            { id: "headers", label: "HTTP request headers" }
          ],
          correctOptionIds: ["query", "headers"]
        },
        submittedValue: JSON.stringify(["query", "headers", "unknown"])
      }).isCorrect
    ).toBe(false);
  });

  it("does not expose correct multiple-choice option ids in public submission config", () => {
    expect(
      getChallengeSubmissionConfig({
        challengeType: ChallengeType.MULTIPLE_CHOICE,
        validationConfig: {
          type: "multiple_choice",
          allowMultiple: true,
          options: [
            { id: "query", label: "Query string parameters" },
            { id: "headers", label: "HTTP request headers" }
          ],
          correctOptionIds: ["query"]
        }
      })
    ).toEqual({
      type: "multiple_choice",
      allowMultiple: true,
      options: [
        { id: "query", label: "Query string parameters" },
        { id: "headers", label: "HTTP request headers" }
      ]
    });
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
