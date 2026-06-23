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

export type MultipleChoiceOption = {
  id: string;
  label: string;
};

export type ChallengeSubmissionConfig = {
  type: "text";
} | {
  type: "multiple_choice";
  allowMultiple: boolean;
  options: MultipleChoiceOption[];
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

type MultipleChoiceConfig = {
  type: "multiple_choice";
  allowMultiple: boolean;
  options: MultipleChoiceOption[];
  correctOptionIds: string[];
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

function parseMultipleChoiceConfig(value: unknown): MultipleChoiceConfig | null {
  if (
    !isRecord(value) ||
    value.type !== "multiple_choice" ||
    !Array.isArray(value.options) ||
    !Array.isArray(value.correctOptionIds)
  ) {
    return null;
  }

  const options = value.options.filter((option): option is MultipleChoiceOption => {
    return (
      isRecord(option) &&
      typeof option.id === "string" &&
      option.id.trim().length > 0 &&
      typeof option.label === "string" &&
      option.label.trim().length > 0
    );
  });
  const validOptionIds = new Set(options.map((option) => option.id));
  const correctOptionIds = value.correctOptionIds.filter(
    (optionId): optionId is string => typeof optionId === "string" && validOptionIds.has(optionId)
  );

  if (options.length === 0 || correctOptionIds.length === 0) {
    return null;
  }

  return {
    type: "multiple_choice",
    allowMultiple: value.allowMultiple === true,
    options,
    correctOptionIds
  };
}

function normalizeAnswer(value: string, caseInsensitive = false) {
  const trimmed = value.trim();
  return caseInsensitive ? trimmed.toLowerCase() : trimmed;
}

function parseSubmittedOptionIds(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(trimmed);

    if (Array.isArray(parsed)) {
      return parsed.filter((optionId): optionId is string => typeof optionId === "string");
    }
  } catch {
    return [trimmed];
  }

  return [trimmed];
}

function equalSets(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }

  const rightSet = new Set(right);
  return left.every((value) => rightSet.has(value));
}

export function getChallengeSubmissionConfig({
  challengeType,
  validationConfig
}: Pick<ChallengeValidationInput, "challengeType" | "validationConfig">): ChallengeSubmissionConfig | null {
  if (challengeType === ChallengeType.STATIC_FLAG || challengeType === ChallengeType.SHORT_ANSWER) {
    return { type: "text" };
  }

  if (challengeType === ChallengeType.MULTIPLE_CHOICE) {
    const config = parseMultipleChoiceConfig(validationConfig);

    if (!config) {
      return null;
    }

    return {
      type: "multiple_choice",
      allowMultiple: config.allowMultiple,
      options: config.options
    };
  }

  return null;
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

  if (challengeType === ChallengeType.MULTIPLE_CHOICE) {
    const config = parseMultipleChoiceConfig(validationConfig);

    if (!config) {
      return {
        isCorrect: false,
        feedback: "This challenge is not configured for validation yet.",
        scoreAwarded: 0
      };
    }

    const validOptionIds = new Set(config.options.map((option) => option.id));
    const rawSubmittedOptionIds = parseSubmittedOptionIds(submittedValue);
    const hasInvalidOption = rawSubmittedOptionIds.some((optionId) => !validOptionIds.has(optionId));
    const submittedOptionIds = Array.from(new Set(rawSubmittedOptionIds));
    const isCorrect = config.allowMultiple
      ? !hasInvalidOption && equalSets(submittedOptionIds, config.correctOptionIds)
      : !hasInvalidOption &&
        submittedOptionIds.length === 1 &&
        submittedOptionIds[0] === config.correctOptionIds[0];

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
