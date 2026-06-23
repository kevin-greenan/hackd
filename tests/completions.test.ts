import { AssignmentStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { calculateCompletionPercent, summarizeCompletionStatus } from "@/lib/core/completions";

describe("completion summaries", () => {
  it("returns zero percent when there are no assignments", () => {
    expect(calculateCompletionPercent([], 0)).toBe(0);
  });

  it("calculates rounded completion percentage", () => {
    expect(
      calculateCompletionPercent(
        [
          { status: AssignmentStatus.COMPLETED },
          { status: AssignmentStatus.IN_PROGRESS },
          { status: AssignmentStatus.NOT_STARTED }
        ],
        3
      )
    ).toBe(33);
  });

  it("summarizes completed, in-progress, and not-started work", () => {
    expect(
      summarizeCompletionStatus(
        [{ status: AssignmentStatus.COMPLETED }, { status: AssignmentStatus.IN_PROGRESS }],
        4
      )
    ).toEqual({
      completed: 1,
      inProgress: 1,
      notStarted: 2,
      percent: 25
    });
  });
});
