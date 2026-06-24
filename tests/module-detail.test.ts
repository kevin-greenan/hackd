import { AttemptResult, ContentStatus, Role } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { getChallengeCompletionState } from "@/lib/core/module-detail";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    groupMembership: {
      findMany: vi.fn()
    },
    module: {
      findUnique: vi.fn()
    }
  }
}));

const { prisma } = await import("@/lib/db/prisma");
const { getLearnerModuleDetail } = await import("@/lib/core/module-detail");

describe("module challenge state", () => {
  it("marks a challenge complete when any attempt is correct", () => {
    expect(
      getChallengeCompletionState([
        { result: AttemptResult.INCORRECT },
        { result: AttemptResult.CORRECT }
      ])
    ).toBe(true);
  });

  it("keeps a challenge incomplete without a correct attempt", () => {
    expect(getChallengeCompletionState([{ result: AttemptResult.INCORRECT }])).toBe(false);
  });

  it("allows admins to preview draft modules without learner attempts", async () => {
    vi.mocked(prisma.groupMembership.findMany).mockResolvedValueOnce([]);
    vi.mocked(prisma.module.findUnique).mockResolvedValueOnce({
      id: "module-1",
      title: "Draft Module",
      slug: "draft-module",
      summary: "Draft summary",
      bodyMarkdown: "# Draft",
      difficulty: "beginner",
      estimatedMinutes: 10,
      status: ContentStatus.DRAFT,
      tags: [],
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      createdById: "admin-1",
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      assignments: [],
      completions: [],
      challenges: []
    } as unknown as Awaited<ReturnType<typeof prisma.module.findUnique>>);

    const detail = await getLearnerModuleDetail({
      userId: "admin-1",
      role: Role.ADMIN,
      slug: "draft-module"
    });

    expect(detail?.assignment.targetType).toBe("preview");
  });
});
