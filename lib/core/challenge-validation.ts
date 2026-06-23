import { ChallengeType } from "@prisma/client";

export type ChallengeValidationInput = {
  challengeType: ChallengeType;
  validationConfig: unknown;
  submittedValue: string;
};

export type ChallengeValidationResult = {
  isCorrect: boolean;
  feedback: string;
  scoreAwarded: number;
};

type StaticFlagConfig = {
  type: "static_flag";
  flag: string;
};

type ExactTextConfig = {
  type: "exact_text";
  acceptedAnswers: string[];
  caseInsensitive?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseStaticFlagConfig(value: unknown): StaticFlagConfig | null {
  if (!isRecord(value) || value.type !== "static_flag" || typeof value.flag !== "string") {
    return null;
  }

  return {
    type: "static_flag",
    flag: value.flag
  };
}

function parseExactTextConfig(value: unknown): ExactTextConfig | null {
  if (!isRecord(value) || value.type !== "exact_text" || !Array.isArray(value.acceptedAnswers)) {
    return null;
  }

  const acceptedAnswers = value.acceptedAnswers.filter(
    (answer): answer is string => typeof answer === "string"
  );

  if (acceptedAnswers.length === 0) {
    return null;
  }

  return {
    type: "exact_text",
    acceptedAnswers,
    caseInsensitive: value.caseInsensitive === true
  };
}

function normalizeAnswer(value: string, caseInsensitive = false) {
  const trimmed = value.trim();
  return caseInsensitive ? trimmed.toLowerCase() : trimmed;
}

export function validateChallengeSubmission({
  challengeType,
  validationConfig,
  submittedValue
}: ChallengeValidationInput): ChallengeValidationResult {
  if (challengeType === ChallengeType.STATIC_FLAG) {
    const config = parseStaticFlagConfig(validationConfig);

    if (!config) {
      return {
        isCorrect: false,
        feedback: "This challenge is not configured for validation yet.",
        scoreAwarded: 0
      };
    }

    const isCorrect = normalizeAnswer(submittedValue) === normalizeAnswer(config.flag);

    return {
      isCorrect,
      feedback: isCorrect ? "Correct." : "That answer is not correct.",
      scoreAwarded: isCorrect ? 1 : 0
    };
  }

  if (challengeType === ChallengeType.SHORT_ANSWER) {
    const config = parseExactTextConfig(validationConfig);

    if (!config) {
      return {
        isCorrect: false,
        feedback: "This challenge is not configured for validation yet.",
        scoreAwarded: 0
      };
    }

    const submitted = normalizeAnswer(submittedValue, config.caseInsensitive);
    const isCorrect = config.acceptedAnswers.some(
      (answer) => normalizeAnswer(answer, config.caseInsensitive) === submitted
    );

    return {
      isCorrect,
      feedback: isCorrect ? "Correct." : "That answer is not correct.",
      scoreAwarded: isCorrect ? 1 : 0
    };
  }

  return {
    isCorrect: false,
    feedback: "Submissions are not enabled for this challenge type yet.",
    scoreAwarded: 0
  };
}
