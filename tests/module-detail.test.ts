import { AttemptResult } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { getChallengeCompletionState } from "@/lib/core/module-detail";

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
});
