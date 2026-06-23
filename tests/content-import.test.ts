import { ChallengeType, ContentStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { validateContentImportBundle } from "@/lib/core/content-import";

const validBundle = {
  version: 1,
  modules: [
    {
      title: "Secure Notes Basics",
      slug: "secure-notes-basics",
      summary: "Practice reviewing a small notes feature for common authorization flaws.",
      bodyMarkdown: "# Secure Notes\n\nReview authorization before loading notes.",
      difficulty: "beginner",
      estimatedMinutes: 30,
      status: ContentStatus.PUBLISHED,
      tags: ["appsec"],
      challenges: [
        {
          slug: "secure-notes-static-flag",
          sortOrder: 1,
          required: true
        }
      ]
    }
  ],
  challenges: [
    {
      title: "Secure Notes Static Flag",
      slug: "secure-notes-static-flag",
      description: "Submit the sample flag shown in the lesson.",
      type: ChallengeType.STATIC_FLAG,
      difficulty: "beginner",
      points: 25,
      status: ContentStatus.PUBLISHED,
      tags: ["platform"],
      validationConfig: {
        type: "static_flag",
        flag: "flag{secure-notes}"
      },
      runtimeConfig: null
    }
  ]
};

describe("content import validation", () => {
  it("accepts a valid content bundle", () => {
    expect(validateContentImportBundle(validBundle).modules[0].slug).toBe("secure-notes-basics");
  });

  it("rejects duplicate module slugs", () => {
    expect(() =>
      validateContentImportBundle({
        ...validBundle,
        modules: [validBundle.modules[0], validBundle.modules[0]]
      })
    ).toThrow("Duplicate module slug: secure-notes-basics");
  });

  it("rejects unknown challenge references", () => {
    expect(() =>
      validateContentImportBundle({
        ...validBundle,
        modules: [
          {
            ...validBundle.modules[0],
            challenges: [
              {
                slug: "missing-challenge",
                sortOrder: 1,
                required: true
              }
            ]
          }
        ]
      })
    ).toThrow("Unknown challenge references: secure-notes-basics:missing-challenge");
  });
});
